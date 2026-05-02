import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { CartItem, GuestCart } from '../api/api.types';
import { useProbeCommerce } from '../hooks/useProbe';
import { trackTikTokAddToCart } from '../utils/tiktokPixel';

interface OptimisticCartItem extends CartItem {
    seller_name?: string;
    product_title?: string;
    variant_title?: string;
    variant_options?: Record<string, string>;
    image_url?: string;
    max_quantity?: number;
    is_available?: boolean;
}

type StoredCartItem = CartItem & {
    seller_name?: string;
    product_title?: string;
    variant_title?: string;
    variant_options?: Record<string, string>;
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
    stockLimitNotice: { id: number; message: string } | null;
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

const normalizeMaxQuantity = (value?: number): number | undefined => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return Math.max(0, Math.floor(value));
};

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
        Number.isFinite(item.price) &&
        item.price >= 0;
}

export const GuestCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [optimisticCart, setOptimisticCart] = useState<OptimisticCartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [stockLimitNotice, setStockLimitNotice] = useState<{ id: number; message: string } | null>(null);
    const { trackAddToCart, trackRemoveFromCart, trackCartView } = useProbeCommerce();
    const cartRef = React.useRef<OptimisticCartItem[]>([]);
    const showStockLimitNotice = useCallback((maxQuantity?: number) => {
        const message = typeof maxQuantity === 'number' && maxQuantity > 0
            ? `Only ${maxQuantity} left for this variant.`
            : 'This variant is out of stock.';
        setStockLimitNotice({ id: Date.now() + Math.floor(Math.random() * 1000), message });
    }, []);

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
                variant_options: stored.variant_options,
                image_url: stored.image_url,
                max_quantity: stored.max_quantity,
                is_available: stored.is_available,
            };
        }));
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        cartRef.current = optimisticCart;
    }, [optimisticCart]);

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
    }, [optimisticCart, isHydrated]);

    useEffect(() => {
        if (!isHydrated || !isCartOpen) return;
        const currentCart = cartRef.current;
        const total = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const count = currentCart.reduce((sum, item) => sum + item.quantity, 0);
        trackCartView(count, total);
    }, [isCartOpen, isHydrated, trackCartView]);

    useEffect(() => {
        if (!stockLimitNotice) return;
        const timer = window.setTimeout(() => setStockLimitNotice(null), 2200);
        return () => window.clearTimeout(timer);
    }, [stockLimitNotice]);

    const addItem = useCallback((
        product_id: string,
        variant_id: string,
        quantity: number,
        price: number,
        metadata?: Partial<OptimisticCartItem>
    ) => {
        if (!product_id || !variant_id || quantity <= 0 || !Number.isFinite(price) || price < 0) return;

        const prev = cartRef.current;
        const index = prev.findIndex((item) => item.product_id === product_id && item.variant_id === variant_id);
        const safeQty = Math.max(1, Math.floor(quantity));

        let next = prev;
        let trackedQuantity = 0;
        let trackedTitle: string | undefined;
        let trackedSeller: string | undefined;
        let noticeMaxQuantity: number | undefined;

        if (index >= 0) {
            const current = prev[index];
            const maxQuantity = normalizeMaxQuantity(metadata?.max_quantity ?? current.max_quantity);
            if (maxQuantity === 0) {
                showStockLimitNotice(maxQuantity);
                return;
            }
            const nextQuantity = current.quantity + safeQty;
            const clampedQuantity = typeof maxQuantity === 'number'
                ? Math.min(nextQuantity, maxQuantity)
                : nextQuantity;
            if (clampedQuantity <= current.quantity) {
                if (typeof maxQuantity === 'number') showStockLimitNotice(maxQuantity);
                return;
            }
            if (typeof maxQuantity === 'number' && clampedQuantity < nextQuantity) {
                noticeMaxQuantity = maxQuantity;
            }

            trackedQuantity = clampedQuantity - current.quantity;
            trackedTitle = metadata?.product_title || current.product_title;
            trackedSeller = metadata?.seller_name || current.seller_name;

            next = [...prev];
            next[index] = { ...current, quantity: clampedQuantity, ...metadata };
        } else {
            const maxQuantity = normalizeMaxQuantity(metadata?.max_quantity);
            if (maxQuantity === 0) {
                showStockLimitNotice(maxQuantity);
                return;
            }
            const clampedQuantity = typeof maxQuantity === 'number'
                ? Math.min(safeQty, maxQuantity)
                : safeQty;
            if (clampedQuantity <= 0) return;
            if (typeof maxQuantity === 'number' && clampedQuantity < safeQty) {
                noticeMaxQuantity = maxQuantity;
            }

            trackedQuantity = clampedQuantity;
            trackedTitle = metadata?.product_title;
            trackedSeller = metadata?.seller_name;
            next = [...prev, { product_id, variant_id, quantity: clampedQuantity, price: Math.max(0, price), ...metadata }];
        }

        setOptimisticCart(next);
        cartRef.current = next;

        if (typeof noticeMaxQuantity === 'number') {
            showStockLimitNotice(noticeMaxQuantity);
        }
        if (trackedQuantity > 0) {
            trackAddToCart(product_id, trackedQuantity, price);
            trackTikTokAddToCart([{
                product_id,
                quantity: trackedQuantity,
                price,
                product_title: trackedTitle,
                seller_name: trackedSeller,
            }]);
        }
    }, [trackAddToCart, showStockLimitNotice]);

    const removeItem = useCallback((product_id: string, variant_id: string) => {
        trackRemoveFromCart(product_id);
        const next = cartRef.current.filter((item) => !(item.product_id === product_id && item.variant_id === variant_id));
        setOptimisticCart(next);
        cartRef.current = next;
    }, [trackRemoveFromCart]);

    const updateQuantity = useCallback((product_id: string, variant_id: string, newQuantity: number) => {
        const prev = cartRef.current;
        const index = prev.findIndex((item) => item.product_id === product_id && item.variant_id === variant_id);
        if (index < 0) return;

        if (newQuantity <= 0) {
            removeItem(product_id, variant_id);
            return;
        }

        const target = prev[index];
        const maxQuantity = normalizeMaxQuantity(target.max_quantity);
        const safeQuantity = typeof maxQuantity === 'number'
            ? Math.min(Math.max(1, Math.floor(newQuantity)), maxQuantity)
            : Math.max(1, Math.floor(newQuantity));

        if (typeof maxQuantity === 'number' && newQuantity > maxQuantity) {
            showStockLimitNotice(maxQuantity);
        }
        if (safeQuantity <= 0) {
            showStockLimitNotice(0);
            removeItem(product_id, variant_id);
            return;
        }

        const next = [...prev];
        next[index] = { ...target, quantity: safeQuantity };
        setOptimisticCart(next);
        cartRef.current = next;
    }, [removeItem, showStockLimitNotice]);

    const clearCart = useCallback(() => {
        setOptimisticCart([]);
        cartRef.current = [];
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
        stockLimitNotice,
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
