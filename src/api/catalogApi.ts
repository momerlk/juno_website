/**
 * Catalog API
 * 
 * Public product browsing, search, filtering, collections, drops, and brand storefronts.
 * 
 * @module Catalog
 */

import { request, APIResponse } from "./core";
import type {
    CatalogProduct,
    FilterOptions,
    ProductFilterRequest,
    Collection,
    Drop,
    CreateDropRequest,
    UpdateDropRequest,
    BrandStorefront,
    TrendingSearch,
    GenderOverview,
} from "./api.types";

// ============================================================================
// Public Catalog API
// ============================================================================

export namespace Catalog {
    const BASE_PATH = '/catalog';

    /**
     * List products with optional filters
     * 
     * Query parameters: category, seller_id, min_price, max_price,
     * sort (price|created_at), order (asc|desc), page, limit
     */
    export async function getProducts(params?: {
        category?: string;
        seller_id?: string;
        min_price?: number;
        max_price?: number;
        sort?: 'price' | 'created_at';
        order?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }): Promise<APIResponse<CatalogProduct[]>> {
        const qp = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}/products${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get product by ID
     * 
     * Returns full product details including variants, pricing,
     * inventory, seller info, and categories.
     */
    export async function getProduct(id: string): Promise<APIResponse<CatalogProduct>> {
        return request(`${BASE_PATH}/products/${id}`, 'GET', undefined, undefined, true);
    }

    /**
     * Search products by keyword
     * 
     * Full-text search across product titles, descriptions, and tags.
     */
    export async function searchProducts(params: { keyword: string; page?: number; limit?: number }): Promise<APIResponse<CatalogProduct[]>> {
        const qp = new URLSearchParams(params as any).toString();
        return request(`${BASE_PATH}/products/search?${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Advanced multi-criteria filter
     * 
     * Use POST when query params are insufficient (e.g., multiple sizes/colors).
     * Supports: category_id, seller_id, price range, sizes, colors, materials,
     * product_types, occasions, keyword, sorting, pagination.
     */
    export async function filterProducts(filters: ProductFilterRequest): Promise<APIResponse<CatalogProduct[]>> {
        return request(`${BASE_PATH}/products/filter`, 'POST', filters, undefined, true);
    }

    /**
     * Get available filter options
     * 
     * Returns all available filter values for populating search sidebar:
     * sizes, price ranges, categories, colors, brands, materials, occasions, product types.
     */
    export async function getFilters(): Promise<APIResponse<FilterOptions>> {
        return request(`${BASE_PATH}/products/filters`, 'GET', undefined, undefined, true);
    }

    /**
     * Get popular products
     *
     * Returns ranked list of popular products for guest storefronts
     * and landing pages.
     */
    export async function getPopularProducts(limit?: number): Promise<APIResponse<CatalogProduct[]>> {
        const qp = limit ? `?limit=${limit}` : '';
        return request(`${BASE_PATH}/products/popular${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get gender overview
     *
     * Returns paginated product list and brand list for a gender category.
     * Men includes products tagged male or unisex. Women includes products tagged female or unisex.
     */
    export async function getGenderOverview(
        gender: 'men' | 'women',
        params?: {
            page?: number;
            limit?: number;
            sort?: 'price' | 'created_at';
            order?: 'asc' | 'desc';
            min_price?: number;
            max_price?: number;
            category?: string;
        }
    ): Promise<APIResponse<GenderOverview>> {
        // Only include defined parameters
        const searchParams = new URLSearchParams();
        if (params) {
            if (params.page !== undefined) searchParams.set('page', String(params.page));
            if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
            if (params.sort !== undefined) searchParams.set('sort', params.sort);
            if (params.order !== undefined) searchParams.set('order', params.order);
            if (params.min_price !== undefined) searchParams.set('min_price', String(params.min_price));
            if (params.max_price !== undefined) searchParams.set('max_price', String(params.max_price));
            if (params.category !== undefined) searchParams.set('category', params.category);
        }
        
        const qp = searchParams.toString() ? `?${searchParams.toString()}` : '';
        const endpoint = `${BASE_PATH}/gender/${gender}${qp}`;
        console.log('[Catalog.getGenderOverview] Calling endpoint:', endpoint);
        return request(endpoint, 'GET', undefined, undefined, true);
    }

    /**
     * Get related products
     *
     * Returns recommendation set related to the given product.
     */
    export async function getRelatedProducts(productId: string, limit?: number): Promise<APIResponse<CatalogProduct[]>> {
        const qp = limit ? `?limit=${limit}` : '';
        return request(`${BASE_PATH}/products/${productId}/related${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get trending searches
     * 
     * Returns most-searched keywords with search counts.
     */
    export async function getTrendingSearches(limit?: number): Promise<APIResponse<TrendingSearch[]>> {
        const qp = limit ? `?limit=${limit}` : '';
        return request(`${BASE_PATH}/search/trending${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get search autocomplete suggestions
     * 
     * Returns type-ahead suggestions for a given prefix.
     */
    export async function autocomplete(q: string): Promise<APIResponse<string[]>> {
        return request(`${BASE_PATH}/search/autocomplete?q=${encodeURIComponent(q)}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get brand stats
     * 
     * Returns aggregated stats for a brand/seller: product count, average rating.
     */
    export async function getBrandStats(brandId: string): Promise<APIResponse<{ product_count: number; average_rating?: number }>> {
        return request(`${BASE_PATH}/brands/${brandId}/stats`, 'GET', undefined, undefined, true);
    }

    /**
     * Get brand storefront
     * 
     * Returns guest-facing brand landing data for performance marketing
     * and storefront pages. Includes brand info, featured products,
     * collections, and drops.
     */
    export async function getBrandStorefront(brandId: string): Promise<APIResponse<BrandStorefront>> {
        return request(`${BASE_PATH}/brands/${brandId}/storefront`, 'GET', undefined, undefined, true);
    }

    /**
     * List collections
     * 
     * Returns all curated product collections marked as active.
     */
    export async function getCollections(): Promise<APIResponse<Collection[]>> {
        return request(`${BASE_PATH}/collections`, 'GET', undefined, undefined, true);
    }

    /**
     * Get collection by ID or slug
     * 
     * Returns collection details and the first page of products.
     */
    export async function getCollection(idOrSlug: string): Promise<APIResponse<{ collection: Collection; products: CatalogProduct[] }>> {
        return request(`${BASE_PATH}/collections/${idOrSlug}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get collection products
     * 
     * Returns paginated list of products belonging to a collection.
     */
    export async function getCollectionProducts(idOrSlug: string, params?: { page?: number; limit?: number }): Promise<APIResponse<CatalogProduct[]>> {
        const qp = params ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}/collections/${idOrSlug}/products${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * List drops
     * 
     * Returns public drops. By default excludes draft drops and includes
     * announced, live, sold out, and ended drops.
     */
    export async function getDrops(params?: { status?: string; seller_id?: string }): Promise<APIResponse<Drop[]>> {
        const qp = params && Object.keys(params).length ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}/drops${qp}`, 'GET', undefined, undefined, true);
    }

    /**
     * Get drop by ID or slug
     * 
     * Returns drop details and products. This public endpoint increments
     * the drop view_count.
     */
    export async function getDrop(idOrSlug: string): Promise<APIResponse<{ drop: Drop; products: CatalogProduct[] }>> {
        return request(`${BASE_PATH}/drops/${idOrSlug}`, 'GET', undefined, undefined, true);
    }

    /**
     * Set drop reminder
     * 
     * Subscribes an authenticated user or guest to the drop launch reminder.
     * For push notifications, supply expo_token or guest_id.
     */
    export async function setDropReminder(idOrSlug: string, payload: { channel: string; email?: string; guest_id?: string; expo_token?: string }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/drops/${idOrSlug}/remind`, 'POST', payload, undefined, true);
    }

    /**
     * Cancel drop reminder
     * 
     * Cancels a reminder for the current authenticated user or guest.
     */
    export async function cancelDropReminder(idOrSlug: string, payload?: { email?: string }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/drops/${idOrSlug}/remind`, 'DELETE', payload, undefined, true);
    }
}

// ============================================================================
// Admin Catalog API
// ============================================================================

export namespace AdminCatalog {
    const BASE_PATH = '/admin/catalog';

    function getAdminToken(): string | undefined {
        return localStorage.getItem('admin_token') ?? undefined;
    }

    /**
     * Create collection
     * 
     * Creates a new curated collection. All fields optional except title and slug.
     */
    export async function createCollection(collection: {
        title: string;
        slug: string;
        description?: string;
        image_url?: string;
        product_ids?: string[];
        tags?: string[];
        is_active?: boolean;
        priority?: number;
    }): Promise<APIResponse<Collection>> {
        return request(`${BASE_PATH}/collections`, 'POST', collection, getAdminToken());
    }

    /**
     * Update collection
     * 
     * PATCH-like semantics via PUT. All fields optional.
     */
    export async function updateCollection(id: string, collection: Partial<Collection>): Promise<APIResponse<Collection>> {
        return request(`${BASE_PATH}/collections/${id}`, 'PUT', collection, getAdminToken());
    }

    /**
     * Delete collection
     * 
     * Archives the collection by setting is_active to false.
     */
    export async function deleteCollection(id: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/collections/${id}`, 'DELETE', undefined, getAdminToken());
    }

    /**
     * Add products to collection
     * 
     * Appends products to an existing collection.
     */
    export async function addProductsToCollection(id: string, product_ids: string[]): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/collections/${id}/products`, 'POST', { product_ids }, getAdminToken());
    }

    /**
     * Remove product from collection
     *
     * Removes a single product from an existing collection.
     */
    export async function removeProductFromCollection(id: string, productID: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/collections/${id}/products/${productID}`, 'DELETE', undefined, getAdminToken());
    }

    /**
     * Update catalog product (admin)
     *
     * Partially updates an active catalog product.
     */
    export async function updateProduct(
        id: string,
        product: {
            title?: string;
            description?: string;
            status?: 'active' | 'draft' | 'archived';
            is_featured?: boolean;
            tags?: string[];
        }
    ): Promise<APIResponse<CatalogProduct>> {
        return request(`${BASE_PATH}/products/${id}`, 'PATCH', product, getAdminToken());
    }

    /**
     * Delete catalog product (admin)
     *
     * Deletes product and cleans stale collection/drop references.
     */
    export async function deleteProduct(id: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/products/${id}`, 'DELETE', undefined, getAdminToken());
    }

    /**
     * List all drops (admin)
     * 
     * Returns all drops with optional status and seller_id filters.
     */
    export async function getDrops(params?: { status?: string; seller_id?: string }): Promise<APIResponse<Drop[]>> {
        const qp = params && Object.keys(params).length ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}/drops${qp}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Create drop (admin)
     * 
     * Creates a new drop. Admins can set any status.
     */
    export async function createDrop(drop: CreateDropRequest): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops`, 'POST', drop, getAdminToken());
    }

    /**
     * Get drop (admin)
     * 
     * Returns drop details and products.
     */
    export async function getDrop(id: string): Promise<APIResponse<{ drop: Drop; products: CatalogProduct[] }>> {
        return request(`${BASE_PATH}/drops/${id}`, 'GET', undefined, getAdminToken());
    }

    /**
     * Update drop (admin)
     * 
     * Updates drop details. All fields optional.
     */
    export async function updateDrop(id: string, drop: UpdateDropRequest): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops/${id}`, 'PUT', drop, getAdminToken());
    }

    /**
     * Change drop status (admin)
     * 
     * Transitions drop through lifecycle: draft → announced → live → sold_out → ended.
     */
    export async function changeDropStatus(id: string, status: Drop['status']): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops/${id}/status`, 'PATCH', { status }, getAdminToken());
    }

    /**
     * Set drop products (admin)
     * 
     * Replaces or reorders drop products.
     */
    export async function setDropProducts(id: string, product_ids: string[]): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops/${id}/products`, 'POST', { product_ids }, getAdminToken());
    }

    /**
     * List drop reminders (admin)
     * 
     * Returns pending reminders for a drop.
     */
    export async function getDropReminders(id: string): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/drops/${id}/reminders`, 'GET', undefined, getAdminToken());
    }

    /**
     * Get drop analytics (admin)
     * 
     * Returns denormalized drop metrics: reminder count, view count,
     * revenue, orders, conversion rate.
     */
    export async function getDropAnalytics(id: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/drops/${id}/analytics`, 'GET', undefined, getAdminToken());
    }

    /**
     * Admin sync collections from Shopify
     * 
     * Fetches collections from a seller's connected Shopify store
     * and maps them to local collections.
     */
    export async function shopifySyncCollections(seller_id: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/collections/shopify-sync`, 'POST', { seller_id }, getAdminToken());
    }
}
