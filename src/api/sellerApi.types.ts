/**
 * Seller API - Extended Types and Functions
 * 
 * Additional seller endpoints for drops, inventory management,
 * and enhanced analytics.
 * 
 * @module SellerAPI
 */

import { request, APIResponse, API_BASE_URL } from "./core";
import type {
    Drop,
    CreateDropRequest,
    UpdateDropRequest,
    CatalogProduct,
    QueueItem,
} from "./api.types";

// ============================================================================
// Seller API (Extended)
// ============================================================================

export namespace SellerAPI {
    const BASE_PATH = '/api/v2/seller';

    function getSellerToken(): string | undefined {
        return localStorage.getItem('seller_token') ?? 
               localStorage.getItem('token') ?? 
               undefined;
    }

    // ========================================================================
    // Drops Management
    // ========================================================================

    /**
     * List seller drops
     * 
     * Returns drops created by the authenticated seller.
     * Sellers can only manage their own drops in draft status.
     */
    export async function getDrops(params?: { status?: string }, token?: string): Promise<APIResponse<Drop[]>> {
        const qp = params && Object.keys(params).length ? `?${new URLSearchParams(params as any).toString()}` : '';
        return request(`${BASE_PATH}/drops${qp}`, 'GET', undefined, token || getSellerToken());
    }

    /**
     * Create seller drop
     * 
     * Creates a new draft drop proposal. The seller_id is automatically
     * set from the authentication token.
     */
    export async function createDrop(drop: CreateDropRequest, token?: string): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops`, 'POST', drop, token || getSellerToken());
    }

    /**
     * Get seller drop
     * 
     * Returns the drop details and the list of products included.
     */
    export async function getDrop(id: string, token?: string): Promise<APIResponse<{ drop: Drop; products: CatalogProduct[] }>> {
        return request(`${BASE_PATH}/drops/${id}`, 'GET', undefined, token || getSellerToken());
    }

    /**
     * Update seller drop
     * 
     * Updates a seller-owned draft drop. Only drops in draft status
     * can be updated by the seller.
     */
    export async function updateDrop(id: string, drop: UpdateDropRequest, token?: string): Promise<APIResponse<Drop>> {
        return request(`${BASE_PATH}/drops/${id}`, 'PUT', drop, token || getSellerToken());
    }

    /**
     * Get seller drop analytics
     * 
     * Returns real-time performance metrics for a specific drop:
     * reminder count, view count, revenue, order count, units sold,
     * conversion rate.
     */
    export async function getDropAnalytics(id: string, token?: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/drops/${id}/analytics`, 'GET', undefined, token || getSellerToken());
    }

    // ========================================================================
    // Queue Management
    // ========================================================================

    /**
     * Get pending embeddings
     * 
     * Returns products awaiting embedding generation.
     * Despite its name, this route is protected by seller auth.
     */
    export async function getPendingEmbeddings(token?: string): Promise<APIResponse<QueueItem[]>> {
        return request(`${BASE_PATH}/queue/pending-embeddings`, 'GET', undefined, token || getSellerToken());
    }

    // ========================================================================
    // Inventory Management
    // ========================================================================

    /**
     * Get low stock inventory
     * 
     * Returns products below the stock threshold.
     * Default threshold is 10 units.
     */
    export async function getLowStock(threshold?: number, token?: string): Promise<APIResponse<any[]>> {
        const qp = threshold ? `?threshold=${threshold}` : '';
        return request(`${BASE_PATH}/inventory/low-stock${qp}`, 'GET', undefined, token || getSellerToken());
    }

    /**
     * Get inventory categories
     * 
     * Returns category breakdown of seller's inventory with counts.
     */
    export async function getInventoryCategories(token?: string): Promise<APIResponse<any[]>> {
        return request(`${BASE_PATH}/inventory/categories`, 'GET', undefined, token || getSellerToken());
    }

    /**
     * Bulk update inventory
     * 
     * Updates inventory quantities for multiple products/variants.
     * 
     * Body format:
     * [
     *   { product_id, variant_id, quantity_change, reason }
     * ]
     * 
     * Reasons: restock, damage, sale, adjustment, etc.
     */
    export async function bulkUpdateInventory(
        updates: { product_id: string; variant_id: string; quantity_change: number; reason: string }[],
        token?: string
    ): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/inventory/bulk-update`, 'POST', updates, token || getSellerToken());
    }

    // ========================================================================
    // Order Fulfillment
    // ========================================================================

    /**
     * Book delivery for order
     * 
     * Initiates delivery booking for a seller order.
     */
    export async function bookDelivery(orderId: string, token?: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${orderId}/fulfill`, 'POST', {}, token || getSellerToken());
    }

    /**
     * Get airway bill
     * 
     * Downloads the airway bill PDF for an order.
     * Returns Blob for download.
     */
    export async function getAirwayBill(orderId: string): Promise<APIResponse<Blob>> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/airway-bill`);
            if (!response.ok) {
                return { status: response.status, ok: false, body: {} as Blob };
            }
            const blob = await response.blob();
            return { status: response.status, ok: true, body: blob };
        } catch (error) {
            return { status: 0, ok: false, body: {} as Blob };
        }
    }
}
