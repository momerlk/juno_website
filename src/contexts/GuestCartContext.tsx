import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { GuestCommerce } from '../api/commerceApi';
import type { GuestCart, GuestCartResponse, CartItem } from '../api/api.types';
import { useProbeCommerce } from '../hooks/useProbe';

// ============================================================================
// Types
// ============================================================================

type SyncState = 'idle' | 'dirty' | 'syncing' | 'error';

interface CartOperation {
    type: 'add' | 'remove' | 'update';
    product_id: string;
    variant_id: string;
    quantity?: number;
    price?: number;
    timestamp: number;
}

interface OptimisticCartItem extends CartItem {
    seller_name?: string;
    product_title?: string;
    variant_title?: string;
    image_url?: string;
}

interface GuestCartContextValue {
    // State
    optimisticCart: OptimisticCartItem[];
    syncState: SyncState;
    isCartOpen: boolean;
    
    // Derived
    itemCount: number;
    cartTotal: number;
    guestCartId: string | null;
    
    // Actions
    addItem: (product_id: string, variant_id: string, quantity: number, price: number, metadata?: Partial<OptimisticCartItem>) => void;
    removeItem: (product_id: string, variant_id: string) => void;
    updateQuantity: (product_id: string, variant_id: string, newQuantity: number) => void;
    clearCart: () => void;
    setCartOpen: (open: boolean) => void;
    refreshCart: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEYS = {
    CART_ID: 'juno_guest_cart_id',
    CART_SNAPSHOT: 'juno_guest_cart_snapshot',
    CART_OPS: 'juno_guest_cart_ops',
    LAST_CHECKOUT_PHONE: 'juno_last_checkout_phone',
    LAST_CHECKOUT_EMAIL: 'juno_last_checkout_email',
};

const COOKIE_EXPIRY_DAYS = 14;
const SYNC_RETRY_DELAYS = [1000, 3000, 8000];
const DEBOUNCE_DELAY = 500;

// ============================================================================
// Context
// ============================================================================

const GuestCartContext = createContext<GuestCartContextValue | undefined>(undefined);

// ============================================================================
// Helper Functions
// ============================================================================

function setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage errors
    }
}

// ============================================================================
// Provider Component
// ============================================================================

export const GuestCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State
    const [optimisticCart, setOptimisticCart] = useState<OptimisticCartItem[]>([]);
    const [persistedCart, setPersistedCart] = useState<GuestCart | null>(null);
    const [operationQueue, setOperationQueue] = useState<CartOperation[]>([]);
    const [syncState, setSyncState] = useState<SyncState>('idle');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [guestCartId, setGuestCartId] = useState<string | null>(null);
    
    // Analytics
    const { trackAddToCart, trackRemoveFromCart, trackCartView } = useProbeCommerce();
    
    // Initialize cart from localStorage/cookie on mount
    useEffect(() => {
        const storedCartId = getCookie(STORAGE_KEYS.CART_ID) || localStorage.getItem(STORAGE_KEYS.CART_ID);
        const storedSnapshot = loadFromStorage<GuestCart | null>(STORAGE_KEYS.CART_SNAPSHOT, null);
        const storedOps = loadFromStorage<CartOperation[]>(STORAGE_KEYS.CART_OPS, []);
        
        if (storedCartId) {
            setGuestCartId(storedCartId);
        }
        
        if (storedSnapshot) {
            setPersistedCart(storedSnapshot);
            setOptimisticCart(storedSnapshot.items.map((item) => ({
                ...item,
                seller_name: (item as any).seller_name,
                product_title: (item as any).product_title,
                variant_title: (item as any).variant_title,
                image_url: (item as any).image_url,
            })));
        }
        
        if (storedOps.length > 0) {
            setOperationQueue(storedOps);
        }
    }, []);
    
    // Background sync effect
    useEffect(() => {
        if (operationQueue.length === 0 || syncState === 'syncing') {
            return;
        }
        
        setSyncState('dirty');
        
        const timeoutId = setTimeout(() => {
            flushOperations();
        }, DEBOUNCE_DELAY);
        
        return () => clearTimeout(timeoutId);
    }, [operationQueue]);

    // Persist operation queue
    useEffect(() => {
        saveToStorage(STORAGE_KEYS.CART_OPS, operationQueue);
    }, [operationQueue]);
    
    // Flush operations to server
    const flushOperations = useCallback(async () => {
        if (operationQueue.length === 0) return;
        
        setSyncState('syncing');
        
        const opsToFlush = [...operationQueue];
        let currentCartId = guestCartId;
        
        for (let i = 0; i < opsToFlush.length; i++) {
            const op = opsToFlush[i];
            
            try {
                let response;
                
                if (op.type === 'add') {
                    response = await GuestCommerce.addToCart(
                        { product_id: op.product_id, variant_id: op.variant_id, quantity: op.quantity || 1 },
                        currentCartId || undefined
                    );
                } else if (op.type === 'remove' && currentCartId) {
                    response = await GuestCommerce.removeFromCart(op.product_id, op.variant_id, currentCartId);
                } else if (op.type === 'update' && currentCartId) {
                    // For updates, we add/remove to reach the target quantity
                    const currentItem = optimisticCart.find(
                        (item) => item.product_id === op.product_id && item.variant_id === op.variant_id
                    );
                    if (currentItem) {
                        const delta = (op.quantity || 0) - currentItem.quantity;
                        if (delta > 0) {
                            response = await GuestCommerce.addToCart(
                                { product_id: op.product_id, variant_id: op.variant_id, quantity: delta },
                                currentCartId
                            );
                        } else if (delta < 0) {
                            response = await GuestCommerce.removeFromCart(op.product_id, op.variant_id, currentCartId);
                        }
                    }
                }
                
                if (response?.ok && response.body) {
                    const cartResponse = response.body as GuestCartResponse;
                    const newCartId = cartResponse.guest_cart_id;
                    
                    if (newCartId) {
                        currentCartId = newCartId;
                    }
                    
                    setPersistedCart(cartResponse.cart);
                    
                    // Update cookie and localStorage with latest cart ID
                    if (newCartId && newCartId !== guestCartId) {
                        setGuestCartId(newCartId);
                        setCookie(STORAGE_KEYS.CART_ID, newCartId, COOKIE_EXPIRY_DAYS);
                        localStorage.setItem(STORAGE_KEYS.CART_ID, newCartId);
                    }
                }
            } catch (error) {
                // Exponential backoff retry could be implemented here
                setSyncState('error');
                console.error('Cart sync error:', error);
                return;
            }
        }
        
        // Clear flushed operations
        setOperationQueue((prev) => prev.slice(opsToFlush.length));
        setSyncState('idle');
    }, [operationQueue, guestCartId, optimisticCart]);
    
    // Add item to cart
    const addItem = useCallback((
        product_id: string,
        variant_id: string,
        quantity: number,
        price: number,
        metadata?: Partial<OptimisticCartItem>
    ) => {
        // Track analytics
        trackAddToCart(product_id, quantity, price);

        setOptimisticCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.product_id === product_id && item.variant_id === variant_id
            );
            
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + quantity,
                    ...metadata,
                };
                return updated;
            }
            
            return [
                ...prev,
                {
                    product_id,
                    variant_id,
                    quantity,
                    price,
                    ...metadata,
                },
            ];
        });
        
        setOperationQueue((prev) => [
            ...prev,
            { type: 'add', product_id, variant_id, quantity, price, timestamp: Date.now() },
        ]);
    }, []);
    
    // Remove item from cart
    const removeItem = useCallback((product_id: string, variant_id: string) => {
        // Track analytics
        trackRemoveFromCart(product_id);

        setOptimisticCart((prev) =>
            prev.filter((item) => !(item.product_id === product_id && item.variant_id === variant_id))
        );
        
        setOperationQueue((prev) => [
            ...prev,
            { type: 'remove', product_id, variant_id, timestamp: Date.now() },
        ]);
    }, []);
    
    // Update quantity
    const updateQuantity = useCallback((product_id: string, variant_id: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(product_id, variant_id);
            return;
        }
        
        setOptimisticCart((prev) =>
            prev.map((item) =>
                item.product_id === product_id && item.variant_id === variant_id
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
        
        setOperationQueue((prev) => [
            ...prev,
            { type: 'update', product_id, variant_id, quantity: newQuantity, timestamp: Date.now() },
        ]);
    }, [removeItem]);
    
    // Clear cart
    const clearCart = useCallback(() => {
        setOptimisticCart([]);
        setOperationQueue([]);
        setPersistedCart(null);
        
        localStorage.removeItem(STORAGE_KEYS.CART_SNAPSHOT);
        localStorage.removeItem(STORAGE_KEYS.CART_OPS);
    }, []);
    
    // Refresh cart from server
    const refreshCart = useCallback(async () => {
        if (!guestCartId) return;
        
        try {
            const response = await GuestCommerce.getCart(guestCartId);
            if (response.ok && response.body) {
                const cartResponse = response.body as GuestCartResponse;
                setPersistedCart(cartResponse.cart);
                setOptimisticCart(cartResponse.cart.items.map((item) => ({
                    ...item,
                    seller_name: (item as any).seller_name,
                    product_title: (item as any).product_title,
                    variant_title: (item as any).variant_title,
                    image_url: (item as any).image_url,
                })));
                saveToStorage(STORAGE_KEYS.CART_SNAPSHOT, cartResponse.cart);
            }
        } catch (error) {
            console.error('Failed to refresh cart:', error);
        }
    }, [guestCartId]);
    
    // Persist cart snapshot on change
    useEffect(() => {
        // Snapshot should always reflect optimisticCart so it persists across reloads
        // while we wait for server sync.
        const snapshot: GuestCart = {
            id: guestCartId || persistedCart?.id || 'temp',
            user_id: 'guest',
            items: optimisticCart,
            created_at: persistedCart?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        saveToStorage(STORAGE_KEYS.CART_SNAPSHOT, snapshot);

        // Track cart view when items change and cart is open
        if (isCartOpen) {
            const total = optimisticCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const count = optimisticCart.reduce((sum, item) => sum + item.quantity, 0);
            trackCartView(count, total);
        }
    }, [optimisticCart, guestCartId, persistedCart, isCartOpen, trackCartView]);
    
    // Derived values
    const itemCount = useMemo(
        () => optimisticCart.reduce((sum, item) => sum + item.quantity, 0),
        [optimisticCart]
    );
    
    const cartTotal = useMemo(
        () => optimisticCart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [optimisticCart]
    );
    
    const value: GuestCartContextValue = {
        optimisticCart,
        syncState,
        isCartOpen,
        itemCount,
        cartTotal,
        guestCartId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCartOpen: setIsCartOpen,
        refreshCart,
    };
    
    return (
        <GuestCartContext.Provider value={value}>
            {children}
        </GuestCartContext.Provider>
    );
};

// ============================================================================
// Hook
// ============================================================================

export const useGuestCart = (): GuestCartContextValue => {
    const context = useContext(GuestCartContext);
    if (!context) {
        throw new Error('useGuestCart must be used within a GuestCartProvider');
    }
    return context;
};
