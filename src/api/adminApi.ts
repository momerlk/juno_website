import { Order } from "../constants/orders";
import { Product } from "../constants/types";
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

export interface AdminParentOrdersResponse {
    orders: CommerceParentOrder[];
    total: number;
}

export interface AdminParentOrderDetailResponse {
    parent: CommerceParentOrder;
    children: CommerceChildOrder[];
}

export namespace AdminCommerce {
    const BASE_PATH = '/commerce/admin/orders';

    export async function listParentOrders(params?: { status?: string; limit?: number; offset?: number }): Promise<APIResponse<AdminParentOrdersResponse>> {
        const searchParams = new URLSearchParams();
        if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
        if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit));
        if (typeof params?.offset === 'number') searchParams.set('offset', String(params.offset));
        const query = searchParams.toString();
        return request(`${BASE_PATH}${query ? `?${query}` : ''}`, 'GET', undefined, getToken());
    }

    export async function getParentOrder(orderId: string): Promise<APIResponse<AdminParentOrderDetailResponse>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}`, 'GET', undefined, getToken());
    }

    export async function cancelParentOrder(orderId: string, reason?: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/cancel`, 'POST', reason ? { reason } : undefined, getToken());
    }

    export async function updateOrderStatus(orderId: string, status: string, note?: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/status`, 'PATCH', { status, note }, getToken());
    }

    export async function setWarehouseAnchor(orderId: string, anchor: { lat: number; lng: number; city?: string; label?: string }): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/tracking/warehouse`, 'PUT', anchor, getToken());
    }

    export async function updateETA(orderId: string, eta: string): Promise<APIResponse<{ message: string }>> {
        return request(`${BASE_PATH}/${encodeURIComponent(orderId)}/tracking/eta`, 'PATCH', { eta }, getToken());
    }

    export async function getOrderReceipt(orderId: string): Promise<APIResponse<any>> {
        return request(`/commerce/orders/${encodeURIComponent(orderId)}/receipt`, 'GET', undefined, getToken());
    }

    export async function resendOrderReceipt(orderId: string): Promise<APIResponse<{ message: string }>> {
        return request(`/commerce/orders/${encodeURIComponent(orderId)}/receipt/resend`, 'POST', {}, getToken());
    }

    export async function getOrderSupportLink(orderId: string, category?: string): Promise<APIResponse<any>> {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        return request(`/commerce/orders/${encodeURIComponent(orderId)}/support-link${query}`, 'GET', undefined, getToken());
    }
}

export type LogisticsCarrier = 'smartlane' | 'dex';

export namespace AdminLogistics {
    const BASE_PATH = '/admin/logistics';

    export async function getOperationalConfig(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/operational-config`, 'GET', undefined, getToken());
    }

    export async function getOrderBookingData(orderId: string, carrier: LogisticsCarrier): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/booking-data?carrier=${encodeURIComponent(carrier)}`, 'GET', undefined, getToken());
    }

    export async function getBulkBookingData(payload: {
        carrier: LogisticsCarrier;
        order_ids: string[];
        include_location_resolution?: boolean;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/booking-data/bulk`, 'POST', payload, getToken());
    }

    export async function createExport(payload: {
        carrier: LogisticsCarrier;
        order_ids: string[];
        format?: 'xlsx';
        require_human_verified_locations?: boolean;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/exports`, 'POST', payload, getToken());
    }

    export async function getExports(params?: {
        carrier?: LogisticsCarrier;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<APIResponse<any>> {
        const search = new URLSearchParams();
        if (params?.carrier) search.set('carrier', params.carrier);
        if (params?.status) search.set('status', params.status);
        if (typeof params?.page === 'number') search.set('page', String(params.page));
        if (typeof params?.limit === 'number') search.set('limit', String(params.limit));
        const qs = search.toString();
        return request(`${BASE_PATH}/exports${qs ? `?${qs}` : ''}`, 'GET', undefined, getToken());
    }

    export async function markManualBooking(orderId: string, payload: {
        carrier: LogisticsCarrier;
        consignment_number: string;
        airway_bill_number?: string;
        tracking_url?: string;
        booked_at?: string;
        notes?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/manual-booking`, 'POST', payload, getToken());
    }

    export async function bulkManualBooking(payload: {
        bookings: Array<{
            order_id: string;
            carrier: LogisticsCarrier;
            consignment_number: string;
            airway_bill_number?: string;
            tracking_url?: string;
        }>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/manual-booking/bulk`, 'POST', payload, getToken());
    }

    export async function verifyDexLocation(orderId: string, payload: {
        province: string;
        district: string;
        ward?: string;
        specific_address: string;
        apply_as_override?: boolean;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/dex-location-verification`, 'POST', payload, getToken());
    }

    export async function dispatchOverride(orderId: string, payload: {
        dispatch_mode: 'carrier_pickup' | 'seller_center_dropoff' | 'manual_override';
        reason: string;
        approval_reference?: string;
        approved_by?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/dispatch-override`, 'POST', payload, getToken());
    }

    export async function bulkDispatchOverride(payload: {
        overrides: Array<{
            order_id: string;
            dispatch_mode: 'carrier_pickup' | 'seller_center_dropoff' | 'manual_override';
            reason: string;
            approval_reference?: string;
        }>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/dispatch-override/bulk`, 'POST', payload, getToken());
    }

    export async function updateOperationalConfig(payload: Record<string, any>): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/operational-config`, 'PUT', payload, getToken());
    }

    export async function createPickupStrike(sellerId: string, payload: {
        order_id: string;
        reason: string;
        carrier?: string;
        notes?: string;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/${encodeURIComponent(sellerId)}/pickup-strikes`, 'POST', payload, getToken());
    }

    export async function getPickupAging(params?: {
        seller_id?: string;
        carrier?: string;
    }): Promise<APIResponse<any>> {
        const search = new URLSearchParams();
        if (params?.seller_id) search.set('seller_id', params.seller_id);
        if (params?.carrier) search.set('carrier', params.carrier);
        const qs = search.toString();
        return request(`${BASE_PATH}/pickup-aging${qs ? `?${qs}` : ''}`, 'GET', undefined, getToken());
    }

    export async function processPickupAging(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/pickup-aging/process`, 'POST', {}, getToken());
    }

    export async function generateOrderConfirmationMessage(orderId: string, payload?: {
        channel?: 'whatsapp' | 'sms' | 'email';
        tone?: 'friendly' | 'formal';
    }): Promise<APIResponse<{
        order_id: string;
        order_number: string;
        message_primary: string;
        message_variant_confirmation: string;
        combined?: string;
    }>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}/confirmation-message`, 'POST', payload || {}, getToken());
    }
}

export namespace AdminFinancials {
    const BASE_PATH = '/admin/financials';

    export async function getSummary(params?: {
        from?: string;
        to?: string;
        carrier?: string;
        city?: string;
        seller_id?: string;
        order_status?: string;
        payment_method?: string;
        booked_state?: string;
    }): Promise<APIResponse<any>> {
        const search = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v));
        });
        const qs = search.toString();
        return request(`${BASE_PATH}/summary${qs ? `?${qs}` : ''}`, 'GET', undefined, getToken());
    }

    export async function getOrders(params?: {
        from?: string;
        to?: string;
        page?: number;
        limit?: number;
        carrier?: string;
        city?: string;
        seller_id?: string;
        order_status?: string;
        payment_method?: string;
        booked_state?: string;
    }): Promise<APIResponse<any>> {
        const search = new URLSearchParams();
        Object.entries(params || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v));
        });
        const qs = search.toString();
        return request(`${BASE_PATH}/orders${qs ? `?${qs}` : ''}`, 'GET', undefined, getToken());
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

    export async function getHealth(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/health`, 'GET', undefined, getToken());
    }

    export async function listUsers(params?: {
        page?: number;
        limit?: number;
        q?: string;
        role?: string;
        account_status?: string;
    }): Promise<APIResponse<any>> {
        return request(withQuery(`${BASE_PATH}/users`, params), 'GET', undefined, getToken());
    }

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

    export async function bulkUpdateSellerInventory(payload: {
        seller_id: string;
        updates: Array<{ product_id: string; variant_id: string; available_quantity: number }>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/sellers/inventory/bulk`, 'PUT', payload, getToken());
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

    export async function getProduct(productId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products/${encodeURIComponent(productId)}`, 'GET', undefined, getToken());
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

    export async function bulkUpdateProductQueue(payload: {
        queue_ids: string[];
        update: Record<string, any>;
    }): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/bulk`, 'PATCH', payload, getToken());
    }

    export async function rejectProductQueueItem(queueId: string, reason: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/products-queue/${encodeURIComponent(queueId)}/reject`, 'POST', { reason }, getToken());
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

    export async function getOrder(orderId: string): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/orders/${encodeURIComponent(orderId)}`, 'GET', undefined, getToken());
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

    export async function getWaitlist(): Promise<APIResponse<any>> {
        return request(`${BASE_PATH}/waitlist`, 'GET', undefined, getToken());
    }
}

export namespace AdminAPI {
    export const getAllOrders = (): Promise<APIResponse<Order[]>> => request('/admin/orders', 'GET', undefined, getToken());
    
    // api_v2.json does not show a GET /admin/orders/{id} endpoint. 
    // We'll fetch all and filter, or use the orders list.
    export const getOrderById = async (orderId: string): Promise<APIResponse<Order>> => {
        const res = await getAllOrders();
        if (res.ok && Array.isArray(res.body)) {
            const order = res.body.find(o => o.id === orderId);
            if (order) return { ...res, body: order };
            return { ...res, ok: false, status: 404, body: { message: 'Order not found locally' } as any };
        }
        return res as any;
    };

    export const getProductById = (productId: string): Promise<APIResponse<Product>> => request(`/catalog/products/${productId}`, 'GET', undefined, getToken());
    
    export const getAllSellers       = (): Promise<APIResponse<any[]>> => request('/admin/sellers', 'GET', undefined, getToken());
    export const adminGetAllSellers  = (): Promise<APIResponse<any[]>> => request('/admin/sellers', 'GET', undefined, getToken());
    export const adminGetAllInteractions = (): Promise<APIResponse<any[]>> => request('/admin/interactions', 'GET', undefined, getToken());

    export const getSellerDetails = (sellerId: string): Promise<APIResponse<any>> => request(`/admin/sellers/${sellerId}`, 'GET', undefined, getToken());
    export const approveSeller    = (sellerId: string, approved: boolean = true, note: string = "KYC verified"): Promise<APIResponse<any>> => 
        request(`/admin/sellers/${sellerId}/approve`, 'PUT', { approved, note }, getToken());
    export const updateSeller     = (sellerId: string, data: any): Promise<APIResponse<any>> => request(`/admin/sellers/${sellerId}`, 'PUT', data, getToken());

    export const getAllUsers          = (): Promise<APIResponse<any[]>> => request('/admin/users', 'GET', undefined, getToken());
    export const getUserDetails       = async (userId: string): Promise<APIResponse<any>> => {
        const usersRes = await request('/admin/users', 'GET', undefined, getToken());
        if (usersRes.ok && Array.isArray(usersRes.body)) {
            const matched = usersRes.body.find((user: any) => String(user?.id) === String(userId));
            if (matched) return { ...usersRes, body: matched };
            return { ...usersRes, ok: false, status: 404, body: { message: 'User not found' } as any };
        }
        return usersRes as APIResponse<any>;
    };
    export const getWaitlist          = (): Promise<APIResponse<any[]>> => request('/admin/waitlist', 'GET', undefined, getToken());

    export const getProductQueue = (): Promise<APIResponse<any[]>> => request('/admin/products-queue', 'GET', undefined, getToken());
    export const enrichProductQueueItem = (queueId: string, data: { product_type: string; gender: string; sizing_guide?: Record<string, any> }): Promise<APIResponse<any>> =>
        request(`/admin/products-queue/${encodeURIComponent(queueId)}/enrich`, 'PUT', data, getToken());
    export const promoteProductQueueItem = (queueId: string): Promise<APIResponse<any>> =>
        request(`/admin/products-queue/${encodeURIComponent(queueId)}/promote`, 'POST', {}, getToken());
    export const deleteProductQueueItem = (queueId: string): Promise<APIResponse<any>> =>
        request(`/admin/products-queue/${encodeURIComponent(queueId)}`, 'DELETE', undefined, getToken());

    export const scrapeSellerProducts = async (sellerId: string, shopUrl?: string): Promise<APIResponse<any>> => {
        // Prefer scrape endpoint if present; fallback to sync for older routers.
        const body = {
            seller_id: sellerId,
            ...(shopUrl ? { shop_url: shopUrl } : {}),
        };
        const scrapeResp = await request('/admin/shopify/scrape', 'POST', body, getToken());
        if (scrapeResp.ok || scrapeResp.status !== 404) return scrapeResp;
        return request('/admin/shopify/sync', 'POST', body, getToken());
    };

    export const updateOrder      = (orderId: string, data: any): Promise<APIResponse<any>> => request(`/admin/orders/${orderId}`, 'PUT', data, getToken());
    export const updateOrderStatus = (orderId: string, status: string, note?: string): Promise<APIResponse<any>> =>
        request(`/commerce/admin/orders/${orderId}/status`, 'PATCH', { status, note }, getToken());
    export const appendOrderMilestone = (orderId: string, milestone: { label: string, note?: string, location?: any }): Promise<APIResponse<any>> =>
        request(`/admin/orders/${orderId}/tracking/milestone`, 'POST', milestone, getToken());
    export const setOrderWarehouseAnchor = (orderId: string, anchor: { lat: number, lng: number, city?: string, label?: string }): Promise<APIResponse<any>> =>
        request(`/commerce/admin/orders/${orderId}/tracking/warehouse`, 'PUT', anchor, getToken());
    export const updateOrderETA = (orderId: string, eta: string): Promise<APIResponse<any>> =>
        request(`/commerce/admin/orders/${orderId}/tracking/eta`, 'PATCH', { eta }, getToken());
    export const getAllCarts       = (): Promise<APIResponse<any[]>> => request('/admin/carts', 'GET', undefined, getToken());

    export const getAllOTPs       = (): Promise<APIResponse<any[]>> => request('/admin/otps', 'GET', undefined, getToken());
    export const getSystemHealth = (): Promise<APIResponse<any>> => request('/admin/health', 'GET', undefined, getToken());

    export const createUpdate = (data: any): Promise<APIResponse<any>> => request('/admin/updates', 'POST', data, getToken());

    export const broadcastNotification = (title: string, body: string, data?: object): Promise<APIResponse<any>> =>
        request('/admin/notifications/broadcast', 'POST', {
            title,
            body,
            data: data || { additionalProp1: "string", additionalProp2: "string", additionalProp3: "string" },
        }, getToken());

    export const sendNotificationToUser  = (user_id: string, title: string, body: string, data?: object): Promise<APIResponse<any>> =>
        request(`/admin/notifications/users/${user_id}/send`, 'POST', { title, body, data }, getToken());
    export const deleteNotificationToken = (expo_token: string): Promise<APIResponse<any>> =>
        request(`/admin/notifications/tokens/${expo_token}`, 'DELETE', undefined, getToken());
    export const deleteUserNotificationTokens = (user_id: string): Promise<APIResponse<any>> =>
        request(`/admin/notifications/tokens/user/${user_id}`, 'DELETE', undefined, getToken());

    export const createAmbassadorTask = (data: any): Promise<APIResponse<any>> => request('/admin/ambassador/tasks', 'POST', data, getToken());
}

// Keep existing exports for backward compatibility
export const GetAllOrders = AdminAPI.getAllOrders;
export const GetOrderById = AdminAPI.getOrderById;
export const GetProductById = AdminAPI.getProductById;
export const getAllSellers = AdminAPI.getAllSellers;
export const adminGetAllSellers = AdminAPI.adminGetAllSellers;
export const adminGetAllInteractions = AdminAPI.adminGetAllInteractions;
export const getSellerDetails = AdminAPI.getSellerDetails;
export const approveSeller = AdminAPI.approveSeller;
export const updateSeller = AdminAPI.updateSeller;
export const getAllUsers = AdminAPI.getAllUsers;
export const getUserDetails = AdminAPI.getUserDetails;
export const getWaitlist = AdminAPI.getWaitlist;
export const getProductQueue = AdminAPI.getProductQueue;
export const enrichProductQueueItem = AdminAPI.enrichProductQueueItem;
export const promoteProductQueueItem = AdminAPI.promoteProductQueueItem;
export const deleteProductQueueItem = AdminAPI.deleteProductQueueItem;
export const scrapeSellerProducts = AdminAPI.scrapeSellerProducts;
export const updateOrder = AdminAPI.updateOrder;
export const getAllCarts = AdminAPI.getAllCarts;
export const getAllOTPs = AdminAPI.getAllOTPs;
export const getSystemHealth = AdminAPI.getSystemHealth;
export const createUpdate = AdminAPI.createUpdate;
export const broadcastNotification = AdminAPI.broadcastNotification;
export const sendNotificationToUser = AdminAPI.sendNotificationToUser;
export const deleteNotificationToken = AdminAPI.deleteNotificationToken;
export const deleteUserNotificationTokens = AdminAPI.deleteUserNotificationTokens;
export const createAmbassadorTask = AdminAPI.createAmbassadorTask;
