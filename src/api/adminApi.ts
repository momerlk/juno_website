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
    export const getUserDetails       = (userId: string): Promise<APIResponse<any>> => request(`/admin/users/${userId}`, 'GET', undefined, getToken());
    export const getWaitlist          = (): Promise<APIResponse<any[]>> => request('/admin/waitlist', 'GET', undefined, getToken());

    export const getProductQueue = (): Promise<APIResponse<any[]>> => request('/admin/products-queue', 'GET', undefined, getToken());

    export const updateOrder      = (orderId: string, data: any): Promise<APIResponse<any>> => request(`/admin/orders/${orderId}`, 'PUT', data, getToken());
    export const updateOrderStatus = (orderId: string, status: string, note?: string): Promise<APIResponse<any>> => 
        request(`/admin/orders/${orderId}/status`, 'PATCH', { status, note }, getToken());
    export const appendOrderMilestone = (orderId: string, milestone: { label: string, note?: string, location?: any }): Promise<APIResponse<any>> => 
        request(`/admin/orders/${orderId}/tracking/milestone`, 'POST', milestone, getToken());
    export const setOrderWarehouseAnchor = (orderId: string, anchor: { lat: number, lng: number, city?: string, label?: string }): Promise<APIResponse<any>> => 
        request(`/admin/orders/${orderId}/tracking/warehouse`, 'PUT', anchor, getToken());
    export const updateOrderETA = (orderId: string, eta: string): Promise<APIResponse<any>> => 
        request(`/admin/orders/${orderId}/tracking/eta`, 'PATCH', { eta }, getToken());
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
