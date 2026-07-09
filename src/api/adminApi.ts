import { request, API_BASE_URL, APIResponse, APIError } from "./core";
import type { ParentOrder as CommerceParentOrder, Order as CommerceChildOrder } from "./api.types";

export const api_url = API_BASE_URL;

export function setState(data: any) {
    if (data && data.token) {
        localStorage.setItem('admin_token', data.token);
    }
}

// Helper to check if body is an error
function isError(body: any): body is APIError {
    return body && typeof body === "object" && 
           "message" in body && typeof body.message === "string" &&
           // Exclude typical data fields
           !("id" in body) && !("created_at" in body) && !("updated_at" in body);
}

// --- Auth ---
export namespace Auth {
    export interface LoginResponse {
        token: string;
        admin: {
            id: string;
            email: string;
            name: string;
            role: string;
            created_at: string;
            updated_at: string;
        };
    }

    export async function Login(email: string, password: string): Promise<APIResponse<LoginResponse>> {
        const resp = await request<LoginResponse>("/admin/auth/login", "POST", { email, password }, undefined, true);
        if (resp.ok && !isError(resp.body) && (resp.body as LoginResponse).token) {
            localStorage.setItem('admin_token', (resp.body as LoginResponse).token);
        }
        return resp;
    }

    export async function GetProfile(): Promise<APIResponse<any>> {
        return request("/admin/me", "GET", undefined, getToken());
    }

    export async function ChangePassword(old_password: string, new_password: string): Promise<APIResponse<any>> {
        return request("/admin/auth/change-password", "POST", { old_password, new_password }, getToken());
    }

    export async function Refresh(refresh_token: string): Promise<APIResponse<LoginResponse>> {
        const resp = await request<LoginResponse>("/admin/auth/refresh", "POST", { refresh_token }, undefined, true);
        if (resp.ok && !isError(resp.body) && (resp.body as LoginResponse).token) {
            localStorage.setItem('admin_token', (resp.body as LoginResponse).token);
        }
        return resp;
    }

    export function Logout() {
        localStorage.removeItem('admin_token');
    }
}

export type { APIResponse };

const getToken = () => localStorage.getItem('admin_token') ?? undefined;

export interface AdminParentOrderDetailResponse {
    parent: CommerceParentOrder;
    children: CommerceChildOrder[];
}

export namespace AdminCommerce {
    const BASE_PATH = '/commerce/admin/orders';

    export async function getParentOrder(orderId: string): Promise<APIResponse<AdminParentOrderDetailResponse>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}`, 'GET', undefined, getToken());
    }

    export async function cancelParentOrder(orderId: string, reason?: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/cancel`, 'POST', reason ? { reason } : undefined, getToken());
    }

    export async function setWarehouseAnchor(orderId: string, anchor: { lat: number; lng: number; city?: string; label?: string }): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/tracking/warehouse`, 'PUT', anchor, getToken());
    }

    export async function updateETA(orderId: string, eta: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/tracking/eta`, 'PATCH', { eta }, getToken());
    }

}

export namespace AdminPortal {
    const BASE_PATH = '/admin';

    const withQuery = (path: string, params?: Record<string, string | number | undefined | null>) => {
        const search = new URLSearchParams();
        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && String(value).length > 0) {
                search.set(key, String(value));
            }
        });
        const query = search.toString();
        return `${path}${query ? `?${query}` : ''}`;
    };

    export async function listSellers(params?: {
        status?: 'pending' | 'active' | 'suspended' | 'rejected';
        q?: string;
        page?: number;
        limit?: number;
    }): Promise<APIResponse<any>> {
        return request(withQuery(`${BASE_PATH}/sellers`, params), 'GET', undefined, getToken());
    }

    export async function updateSellerProfile(sellerId: string, payload: {
        business_name?: string;
        contact_person?: string;
        phone_number?: string;
        email?: string;
        legal_name?: string;
        commission_rate?: number;
        city?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/profile`, 'PATCH', payload, getToken());
    }

    export async function bulkUpdateSellerStatus(payload: {
        seller_ids: string[];
        status: 'pending' | 'active' | 'suspended' | 'rejected';
        note?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/status`, 'PATCH', payload, getToken());
    }

    export async function getSellerInventory(sellerId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/inventory`, 'GET', undefined, getToken());
    }

    export async function updateSellerInventory(sellerId: string, payload: {
        product_id: string;
        variant_id: string;
        available_quantity: number;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/inventory`, 'PUT', payload, getToken());
    }

    export async function getSellerWallet(sellerId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/wallet`, 'GET', undefined, getToken());
    }

    export async function adjustSellerWallet(sellerId: string, payload: {
        amount: number;
        direction: 'debit' | 'credit';
        reason: string;
        adjustment_type: string;
        related_order_id?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/wallet/adjustments`, 'POST', payload, getToken());
    }

    export async function listSellerDrafts(params?: {
        email?: string;
        step?: number;
        page?: number;
        limit?: number;
    }): Promise<APIResponse<any>> {
        return request(withQuery(`${BASE_PATH}/seller-drafts`, params), 'GET', undefined, getToken());
    }

    export async function listProducts(params?: {
        seller_id?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<APIResponse<any>> {
        return request(withQuery(`${BASE_PATH}/products`, params), 'GET', undefined, getToken());
    }

    export async function updateProduct(productId: string, update: Record<string, any>): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products/${encodeURIComponent(productId)}`, 'PATCH', update, getToken());
    }

    export async function deleteProduct(productId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products/${encodeURIComponent(productId)}`, 'DELETE', undefined, getToken());
    }

    export async function bulkUpdateProducts(payload: {
        product_ids: string[];
        update: Record<string, any>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products/bulk`, 'PATCH', payload, getToken());
    }

    export async function bulkDeleteProducts(payload: { product_ids: string[] }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products/bulk-delete`, 'POST', payload, getToken());
    }

    export async function listProductQueue(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue`, 'GET', undefined, getToken());
    }

    export async function updateProductQueueItem(queueId: string, update: Record<string, any>): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}`, 'PUT', update, getToken());
    }

    export async function enrichProductQueueItem(queueId: string, enrichment: {
        product_type: string;
        gender: string;
        sizing_guide?: Record<string, any>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}/enrich`, 'PUT', enrichment, getToken());
    }

    export async function promoteProductQueueItem(queueId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}/promote`, 'POST', {}, getToken());
    }

    export async function bulkUpdateProductQueue(payload: {
        queue_ids: string[];
        update: Record<string, any>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk`, 'PATCH', payload, getToken());
    }

    export async function rejectProductQueueItem(queueId: string, reason: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}/reject`, 'POST', { reason }, getToken());
    }

    export async function deleteProductQueueItem(queueId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}`, 'DELETE', undefined, getToken());
    }

    export async function bulkEnrichProductQueue(payload: {
        queue_ids: string[];
        enrichment: {
            product_type: string;
            gender: string;
            sizing_guide?: Record<string, any>;
        };
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk/enrich`, 'POST', payload, getToken());
    }

    export async function bulkPromoteProductQueue(payload: { queue_ids: string[]; allow_unenriched?: boolean }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk/promote`, 'POST', payload, getToken());
    }

    export async function bulkRejectProductQueue(payload: { queue_ids: string[]; reason: string }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk/reject`, 'POST', payload, getToken());
    }

    export async function bulkDeleteProductQueue(payload: { queue_ids: string[] }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk/delete`, 'POST', payload, getToken());
    }

    export async function listOrders(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders`, 'GET', undefined, getToken());
    }

    export async function updateOrder(orderId: string, payload: Record<string, any>): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}`, 'PUT', payload, getToken());
    }

    export async function bulkUpdateOrders(payload: {
        updates: Array<{ order_id: string; status: string; note?: string }>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/status`, 'PATCH', payload, getToken());
    }

    export async function bulkCancelOrders(payload: { order_ids: string[]; reason: string }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/bulk-cancel`, 'POST', payload, getToken());
    }

    export async function updateOrderCustomer(orderId: string, payload: {
        name?: string;
        email?: string;
        phone?: string;
        address_line1?: string;
        address_line2?: string;
        city?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/customer`, 'PATCH', payload, getToken());
    }

    export async function cancelOrder(orderId: string, reason: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/cancel`, 'POST', { reason }, getToken());
    }

    export async function listCarts(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/carts`, 'GET', undefined, getToken());
    }
}

export const GetProductById = (productId: string): Promise<APIResponse<any>> =>
    request(`/catalog/products/${encodeURIComponent(productId)}`, 'GET', undefined, getToken());

export const approveSeller = (sellerId: string, approved: boolean = true, note: string = 'KYC verified'): Promise<APIResponse<any>> =>
    request(`/admin/sellers/${encodeURIComponent(sellerId)}/approve`, 'PUT', { approved, note }, getToken());

export const scrapeSellerProducts = async (sellerId: string, shopUrl?: string): Promise<APIResponse<any>> => {
    const body = {
        seller_id: sellerId,
        ...(shopUrl ? { shop_url: shopUrl } : {}),
    };
    const scrapeResp = await request('/admin/shopify/scrape', 'POST', body, getToken());
    if (scrapeResp.ok || scrapeResp.status !== 404) return scrapeResp;
    return request('/admin/shopify/sync', 'POST', body, getToken());
};

export const broadcastNotification = (title: string, body: string, data?: object): Promise<APIResponse<any>> =>
    request('/admin/notifications/broadcast', 'POST', {
        title,
        body,
        data: data || { additionalProp1: 'string', additionalProp2: 'string', additionalProp3: 'string' },
    }, getToken());
