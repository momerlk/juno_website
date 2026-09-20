import type { CatalogProduct } from './api.types';
import { RECSYSTEM_BASE_URL } from './core';

const BASE_URL = `${RECSYSTEM_BASE_URL}/api/v1`;

export type RecommendationItem = {
    id: string;
    title: string;
    seller_name?: string;
    pricing?: { effective_price?: number };
    image?: { url?: string } | null;
    available?: boolean;
    _meta?: { position?: number };
};

export type RecommendationFeed = {
    items: RecommendationItem[];
    cursor: string | null;
    request_id?: string;
};

export type RecommendationShelf = {
    products: CatalogProduct[];
    request_id?: string;
};

type RecsysProduct = CatalogProduct & { media?: { images?: string[] } };

const normalizeProduct = (product: RecsysProduct): CatalogProduct => ({
    ...product,
    images: product.images?.length ? product.images : product.media?.images ?? [],
});

// Events doc asks for a monotonically increasing per-session sequence.
let sequence = Date.now() % 1_000_000_000;

const post = async <T,>(path: string, body: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Recommendations unavailable (${response.status})`);
    return response.json() as Promise<T>;
};

export const Recommendations = {
    async getShelf(user_id: string, session_id: string, refresh = false, filters?: Record<string, unknown>): Promise<RecommendationShelf> {
        const shelf = await post<RecommendationShelf & { products: RecsysProduct[] }>('/recommendations', {
            user_id,
            session_id,
            num_products: 12,
            surface: 'swipe_shop',
            refresh,
            filters,
        });
        return { ...shelf, products: shelf.products.map(normalizeProduct) };
    },

    getFeed(user_id: string, session_id: string, cursor: string | null = null) {
        return post<RecommendationFeed>('/feed', { user_id, session_id, cursor, page_size: 8, compact: true, refresh: false });
    },

    async getProduct(id: string): Promise<CatalogProduct> {
        const response = await fetch(`${BASE_URL}/products/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error(`Product unavailable (${response.status})`);
        const body = await response.json() as { product: RecsysProduct };
        return normalizeProduct(body.product);
    },

    sendEvent(user_id: string, session_id: string, kind: 'impression' | 'view' | 'save' | 'dislike' | 'add_to_cart', product_id: string, request_id?: string, position?: number) {
        void post('/events', {
            user_id,
            session_id,
            events: [{ kind, product_id, request_id, position, sequence: sequence++ }],
        }).catch(() => undefined);
    },
};
