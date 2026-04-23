import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { CartItem, GuestCart } from '../api/api.types';
import { useProbeCommerce } from '../hooks/useProbe';

interface OptimisticCartItem extends CartItem {
    seller_name?: string;
    product_title?: string;
    variant_title?: string;
    image_url?: string;
    max_quantity?: number;
    is_available?: boolean;
}

type StoredCartItem = CartItem & {
    seller_name?: string;
    product_title?: string;
    variant_title?: string;
    image_url?: string;
    max_quantity?: number;
    is_available?: boolean;
};

interface GuestCartContextValue {
    optimisticCart: OptimisticCartItem[];
    isCartOpen: boolean;
    isHydrated: boolean;
    itemCount: number;
    cartTotal: number;
    addItem: (product_id: string, variant_id: string, quantity: number, price: number, metadata?: Partial<OptimisticCartItem>) => void;
    removeItem: (product_id: string, variant_id: string) => void;
    updateQuantity: (product_id: string, variant_id: string, newQuantity: number) => void;
    clearCart: () => void;
    setCartOpen: (open: boolean) => void;
}

const STORAGE_KEYS = {
    CART_SNAPSHOT: 'juno_guest_cart_snapshot',
};

const GuestCartContext = createContext<GuestCartContextValue | undefined>(undefined);

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

export const GuestCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [optimisticCart, setOptimisticCart] = useState<OptimisticCartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const { trackAddToCart, trackRemoveFromCart, trackCartView } = useProbeCommerce();

    useEffect(() => {
        const storedSnapshot = loadFromStorage<GuestCart | null>(STORAGE_KEYS.CART_SNAPSHOT, null);
        const rawItems = Array.isArray(storedSnapshot?.items) ? storedSnapshot.items : [];
        const items = rawItems.filter((item) => isValidCartItem(item));
        setOptimisticCart(items.map((item) => {
            const stored = item as StoredCartItem;
            return {
                ...item,
                seller_name: stored.seller_name,
                product_title: stored.product_title,
                variant_title: stored.variant_title,
                image_url: stored.image_url,
                max_quantity: stored.max_quantity,
                is_available: stored.is_available,
            };
        }));
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        const snapshot: GuestCart = {
            id: 'local-cart',
            user_id: 'guest',
            items: optimisticCart,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        saveToStorage(STORAGE_KEYS.CART_SNAPSHOT, snapshot);

        if (isCartOpen) {
            const total = optimisticCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const count = optimisticCart.reduce((sum, item) => sum + item.quantity, 0);
            trackCartView(count, total);
        }
    }, [optimisticCart, isCartOpen, trackCartView, isHydrated]);

    const addItem = useCallback((
        product_id: string,
        variant_id: string,
        quantity: number,
        price: number,
        metadata?: Partial<OptimisticCartItem>
    ) => {
        if (!product_id || !variant_id || quantity <= 0 || !Number.isFinite(price)) return;

        setOptimisticCart((prev) => {
            const index = prev.findIndex((item) => item.product_id === product_id && item.variant_id === variant_id);
            const safeQty = Math.max(1, quantity);
            if (index >= 0) {
                const current = prev[index];
                const maxQuantity = metadata?.max_quantity ?? current.max_quantity;
                const nextQuantity = current.quantity + safeQty;
                const clampedQuantity = typeof maxQuantity === 'number'
                    ? Math.min(nextQuantity, Math.max(1, maxQuantity))
                    : nextQuantity;
                if (clampedQuantity <= current.quantity) return prev;
                const next = [...prev];
                next[index] = { ...current, quantity: clampedQuantity, ...metadata };
                trackAddToCart(product_id, clampedQuantity - current.quantity, price);
                return next;
            }
            const maxQuantity = metadata?.max_quantity;
            const clampedQuantity = typeof maxQuantity === 'number'
                ? Math.min(safeQty, Math.max(1, maxQuantity))
                : safeQty;
            trackAddToCart(product_id, clampedQuantity, price);
            return [...prev, { product_id, variant_id, quantity: clampedQuantity, price: Math.max(0, price), ...metadata }];
        });
    }, [trackAddToCart]);

    const removeItem = useCallback((product_id: string, variant_id: string) => {
        trackRemoveFromCart(product_id);
        setOptimisticCart((prev) =>
            prev.filter((item) => !(item.product_id === product_id && item.variant_id === variant_id))
        );
    }, [trackRemoveFromCart]);

    const updateQuantity = useCallback((product_id: string, variant_id: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeItem(product_id, variant_id);
            return;
        }
        setOptimisticCart((prev) =>
            prev.map((item) => {
                if (item.product_id !== product_id || item.variant_id !== variant_id) return item;
                const maxQuantity = item.max_quantity;
                const safeQuantity = typeof maxQuantity === 'number'
                    ? Math.min(newQuantity, Math.max(1, maxQuantity))
                    : newQuantity;
                return { ...item, quantity: safeQuantity };
            })
        );
    }, [removeItem]);

    const clearCart = useCallback(() => {
        setOptimisticCart([]);
        localStorage.removeItem(STORAGE_KEYS.CART_SNAPSHOT);
    }, []);

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
        isCartOpen,
        isHydrated,
        itemCount,
        cartTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setCartOpen: setIsCartOpen,
    };

    return (
        <GuestCartContext.Provider value={value}>
            {children}
        </GuestCartContext.Provider>
    );
};

export const useGuestCart = (): GuestCartContextValue => {
    const context = useContext(GuestCartContext);
    if (!context) {
        throw new Error('useGuestCart must be used within a GuestCartProvider');
    }
    return context;
};
