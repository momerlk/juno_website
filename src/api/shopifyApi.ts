/**
 * Shopify API
 * 
 * Shopify store connection and product sync for sellers.
 * Handles OAuth flow, product synchronization, and collection mapping.
 * 
 * @module Shopify
 */

import { request, APIResponse, API_BASE_URL } from "./core";
import type {
    ShopifyConnectionStatus,
    ShopifySyncResponse,
    ShopifyCollectionSyncResponse,
} from "./api.types";

// ============================================================================
// Shopify API
// ============================================================================

export namespace Shopify {
    const BASE_PATH = '/shopify';

    function getSellerToken(): string | undefined {
        return localStorage.getItem('seller_token') ?? 
               localStorage.getItem('token') ?? 
               undefined;
    }

    function getAdminToken(): string | undefined {
        return localStorage.getItem('admin_token') ?? undefined;
    }

    /**
     * Get OAuth authorization URL
     * 
     * Returns the direct OAuth redirect URL to open in a new tab.
     * Cannot use fetch() here — the backend returns a 303 redirect
     * to Shopify which CORS blocks.
     * 
     * Usage: window.open(GetAuthUrl(token, shop), '_blank')
     */
    export function getAuthUrl(token: string, shop: string): string {
        return `${API_BASE_URL}/shopify/auth?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
    }

    /**
     * Get connection status
     * 
     * Returns current Shopify connection status including shop domain,
     * granted scopes, and installation timestamp.
     * 
     * Response when connected:
     * { connected: true, shop: "...", scopes: "...", installed_at: "..." }
     * 
     * Response when not connected:
     * { connected: false }
     */
    export async function getStatus(token?: string): Promise<APIResponse<ShopifyConnectionStatus>> {
        return request(`${BASE_PATH}/status`, 'GET', undefined, token || getSellerToken());
    }

    /**
     * Sync products from Shopify
     * 
     * Fetches all products from the connected Shopify store and
     * enqueues them in the seller moderation queue.
     * 
     * Requires active Shopify connection.
     */
    export async function syncProducts(token?: string): Promise<APIResponse<ShopifySyncResponse>> {
        return request(`${BASE_PATH}/sync`, 'POST', {}, token || getSellerToken());
    }

    /**
     * Sync collections from Shopify
     * 
     * Fetches all collections from the connected Shopify store and
     * maps them to local collections.
     * 
     * Returns count of synced, created, updated, and skipped collections.
     */
    export async function syncCollections(token?: string): Promise<APIResponse<ShopifyCollectionSyncResponse>> {
        return request(`${BASE_PATH}/collections/sync`, 'POST', {}, token || getSellerToken());
    }

    /**
     * Scrape products from public Shopify store
     *
     * Fetches all published products from any public Shopify storefront
     * using the /products.json endpoint. No OAuth required.
     *
     * If shopUrl is omitted, the previously saved public connection is used.
     *
     * Pricing behavior:
     * - brand_price = raw Shopify variant price
     * - price = brand_price + 99 (shipping buffer)
     * - commission_rate = 0.175
     * - seller_payout = calculated from effective brand price
     */
    export async function scrapeProducts(token?: string, shopUrl?: string): Promise<APIResponse<ShopifySyncResponse>> {
        const body = shopUrl ? { shop_url: shopUrl } : {};
        return request(`${BASE_PATH}/scrape`, 'POST', body, token || getSellerToken());
    }

    /**
     * Disconnect Shopify
     *
     * Removes the seller's Shopify connection record and stored access token.
     * Works for both OAuth and public (scrape-based) connections.
     */
    export async function disconnect(token?: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/disconnect`, 'DELETE', undefined, token || getSellerToken());
    }

    // ========================================================================
    // Admin Shopify Management
    // ========================================================================

    /**
     * Admin sync products for a seller
     * 
     * Triggers product sync for a specific seller by admin.
     * Useful for manual re-sync or onboarding flow.
     */
    export async function adminSyncProducts(sellerId: string, token?: string): Promise<APIResponse<ShopifySyncResponse>> {
        return request('/admin/shopify/sync', 'POST', { seller_id: sellerId }, token || getAdminToken());
    }

    /**
     * Admin sync collections for a seller
     * 
     * Triggers collection sync for a specific seller by admin.
     */
    export async function adminSyncCollections(sellerId: string, token?: string): Promise<APIResponse<ShopifyCollectionSyncResponse>> {
        return request('/admin/catalog/collections/shopify-sync', 'POST', { seller_id: sellerId }, token || getAdminToken());
    }
}
