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
    max_quantity?: number;
    is_available?: boolean;
}

interface GuestCartContextValue {
    // State
    optimisticCart: OptimisticCartItem[];
    syncState: SyncState;
    isCartOpen: boolean;
    isHydrated: boolean;
    
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
    flushPending: () => Promise<void>;
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

function isValidCartId(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isValidCartItem(item: Partial<CartItem> | null | undefined): item is CartItem {
    return !!item &&
        typeof item.product_id === 'string' &&
        item.product_id.trim().length > 0 &&
        typeof item.variant_id === 'string' &&
        item.variant_id.trim().length > 0 &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        typeof item.price === 'number' &&
        Number.isFinite(item.price);
}

function getCartLineKey(product_id: string, variant_id: string): string {
    return `${product_id}::${variant_id}`;
}

function chooseString(primary: unknown, fallback?: string): string | undefined {
    if (typeof primary === 'string' && primary.trim().length > 0) {
        return primary;
    }
    if (typeof fallback === 'string' && fallback.trim().length > 0) {
        return fallback;
    }
    return undefined;
}

function mergeServerItemsWithMetadata(
    serverItems: CartItem[],
    previousItems: OptimisticCartItem[]
): OptimisticCartItem[] {
    const previousByKey = new Map<string, OptimisticCartItem>();
    for (const item of previousItems) {
        if (!isValidCartItem(item)) continue;
        previousByKey.set(getCartLineKey(item.product_id, item.variant_id), item);
    }

    return serverItems
        .filter((item) => isValidCartItem(item))
        .map((item) => {
            const key = getCartLineKey(item.product_id, item.variant_id);
            const previous = previousByKey.get(key);
            const raw = item as any;
            return {
                ...item,
                seller_name: chooseString(raw.seller_name, previous?.seller_name),
                product_title: chooseString(raw.product_title, previous?.product_title),
                variant_title: chooseString(raw.variant_title, previous?.variant_title),
                image_url: chooseString(raw.image_url, previous?.image_url),
                max_quantity: raw.max_quantity ?? previous?.max_quantity,
                is_available: raw.is_available ?? previous?.is_available,
            };
        });
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
    const [isHydrated, setIsHydrated] = useState(false);

    const clearStoredCartId = useCallback(() => {
        setGuestCartId(null);
        localStorage.removeItem(STORAGE_KEYS.CART_ID);
        // Expire cookie value immediately
        document.cookie = `${STORAGE_KEYS.CART_ID}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax; Secure`;
    }, []);
    
    // Analytics
    const { trackAddToCart, trackRemoveFromCart, trackCartView } = useProbeCommerce();
    
    // Initialize cart from localStorage/cookie on mount
    useEffect(() => {
        const storedCartId = getCookie(STORAGE_KEYS.CART_ID) || localStorage.getItem(STORAGE_KEYS.CART_ID);
        const storedSnapshot = loadFromStorage<GuestCart | null>(STORAGE_KEYS.CART_SNAPSHOT, null);
        const storedOps = loadFromStorage<CartOperation[]>(STORAGE_KEYS.CART_OPS, []).filter(
            (op) =>
                op &&
                typeof op.product_id === 'string' &&
                op.product_id.trim().length > 0 &&
                typeof op.variant_id === 'string' &&
                op.variant_id.trim().length > 0 &&
                typeof op.timestamp === 'number'
        );
        
        if (isValidCartId(storedCartId)) {
            setGuestCartId(storedCartId);
        }
        
        if (storedSnapshot) {
            const normalizedItems = storedSnapshot.items.filter((item) => isValidCartItem(item));
            setPersistedCart(storedSnapshot);
            setOptimisticCart(normalizedItems.map((item) => ({
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
        setIsHydrated(true);
    }, []);
    
    // Background sync effect
    useEffect(() => {
        if (!isHydrated || operationQueue.length === 0 || syncState === 'syncing') {
            return;
        }
        
        setSyncState('dirty');
        
        const timeoutId = setTimeout(() => {
            flushOperations();
        }, DEBOUNCE_DELAY);
        
        return () => clearTimeout(timeoutId);
    }, [operationQueue, isHydrated, syncState]);

    // Persist operation queue
    useEffect(() => {
        if (!isHydrated) return;
        saveToStorage(STORAGE_KEYS.CART_OPS, operationQueue);
    }, [operationQueue, isHydrated]);
    
    // Flush operations to server
    const flushOperations = useCallback(async () => {
        if (operationQueue.length === 0) return;
        
        setSyncState('syncing');
        
        const opsToFlush = [...operationQueue];
        let currentCartId = guestCartId;
        
        for (let i = 0; i < opsToFlush.length; i++) {
            const op = opsToFlush[i];
            if (!op.product_id || !op.variant_id) {
                continue;
            }
            
            try {
                let response;
                
                if (op.type === 'add') {
                    response = await GuestCommerce.addToCart(
                        { product_id: op.product_id, variant_id: op.variant_id, quantity: op.quantity || 1 },
                        currentCartId || undefined
                    );
                    // Recover automatically from stale guest cart id
                    if (!response.ok && response.status === 400 && currentCartId) {
                        clearStoredCartId();
                        currentCartId = null;
                        response = await GuestCommerce.addToCart(
                            { product_id: op.product_id, variant_id: op.variant_id, quantity: op.quantity || 1 },
                            undefined
                        );
                    }
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

                if (response && !response.ok) {
                    const error = response.body as any;
                    const code = error?.code;
                    const message = String(error?.message || '').toLowerCase();
                    const isUnavailable = code === 'BAD_REQUEST' && (
                        message.includes('variant is currently unavailable') ||
                        message.includes('variant unavailable') ||
                        message.includes('out of stock')
                    );

                    if (isUnavailable) {
                        // Remove invalid item from optimistic cart so UI matches backend reality.
                        setOptimisticCart((prev) =>
                            prev.filter(
                                (item) =>
                                    !(item.product_id === op.product_id && item.variant_id === op.variant_id)
                            )
                        );
                        continue;
                    }

                    setSyncState('error');
                    return;
                }
                
                if (response?.ok && response.body) {
                    const cartResponse = response.body as GuestCartResponse;
                    const newCartId = cartResponse.guest_cart_id;
                    
                    if (newCartId) {
                        currentCartId = newCartId;
                    }
                    
                    setPersistedCart(cartResponse.cart);
                    setOptimisticCart((prev) =>
                        mergeServerItemsWithMetadata(cartResponse.cart.items, prev)
                    );
                    
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
    }, [operationQueue, guestCartId, optimisticCart, clearStoredCartId]);
    
    // Add item to cart
    const addItem = useCallback((
        product_id: string,
        variant_id: string,
        quantity: number,
        price: number,
        metadata?: Partial<OptimisticCartItem>
    ) => {
        if (!product_id || !variant_id || quantity <= 0 || !Number.isFinite(price)) {
            console.warn('Ignoring invalid cart add operation', { product_id, variant_id, quantity, price });
            return;
        }

        const existing = optimisticCart.find(
            (item) => item.product_id === product_id && item.variant_id === variant_id
        );
        const maxQuantity = metadata?.max_quantity ?? existing?.max_quantity;
        const safeRequested = Math.max(1, quantity);
        const nextQuantity = existing ? existing.quantity + safeRequested : safeRequested;
        const clampedQuantity = typeof maxQuantity === 'number'
            ? Math.min(nextQuantity, Math.max(1, maxQuantity))
            : nextQuantity;
        const deltaToApply = existing ? clampedQuantity - existing.quantity : clampedQuantity;
        if (deltaToApply <= 0) {
            return;
        }

        // Track analytics
        trackAddToCart(product_id, deltaToApply, price);

        setOptimisticCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) => item.product_id === product_id && item.variant_id === variant_id
            );
            
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: clampedQuantity,
                    ...metadata,
                };
                return updated;
            }
            
            return [
                ...prev,
                {
                    product_id,
                    variant_id,
                    quantity: clampedQuantity,
                    price: Math.max(0, price),
                    ...metadata,
                },
            ];
        });
        
        setOperationQueue((prev) => [
            ...prev,
            { type: 'add', product_id, variant_id, quantity: deltaToApply, price, timestamp: Date.now() },
        ]);
    }, [trackAddToCart, optimisticCart]);
    
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

        const currentItem = optimisticCart.find(
            (item) => item.product_id === product_id && item.variant_id === variant_id
        );
        const maxQuantity = currentItem?.max_quantity;
        const safeQuantity = typeof maxQuantity === 'number'
            ? Math.min(newQuantity, Math.max(1, maxQuantity))
            : newQuantity;
        
        setOptimisticCart((prev) =>
            prev.map((item) =>
                item.product_id === product_id && item.variant_id === variant_id
                    ? { ...item, quantity: safeQuantity }
                    : item
            )
        );
        
        setOperationQueue((prev) => [
            ...prev,
            { type: 'update', product_id, variant_id, quantity: safeQuantity, timestamp: Date.now() },
        ]);
    }, [removeItem, optimisticCart]);
    
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
                setOptimisticCart((prev) =>
                    mergeServerItemsWithMetadata(cartResponse.cart.items, prev)
                );
                saveToStorage(STORAGE_KEYS.CART_SNAPSHOT, cartResponse.cart);
            }
        } catch (error) {
            console.error('Failed to refresh cart:', error);
        }
    }, [guestCartId]);
    
    // Persist cart snapshot on change
    useEffect(() => {
        if (!isHydrated) return;
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
    }, [optimisticCart, guestCartId, persistedCart, isCartOpen, trackCartView, isHydrated]);
    
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
        isHydrated,
        itemCount,
        cartTotal,
        guestCartId,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCartOpen: setIsCartOpen,
        refreshCart,
        flushPending: async () => {
            if (operationQueue.length > 0) {
                await flushOperations();
            } else {
                await refreshCart();
            }
        },
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
