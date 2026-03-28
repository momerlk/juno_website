import { Order } from "../constants/orders";
import { Product } from "../constants/types";
import { request, API_BASE_URL, APIResponse } from "./core";

export const api_url = API_BASE_URL;

export function setState(data: any) {
    if (data && data.token) {
        localStorage.setItem('admin_token', data.token);
    }
}

// --- Auth ---
export namespace Auth {
    export async function Login(phone_number: string, password: string): Promise<APIResponse<any>> {
        const resp = await request("/auth/login", "POST", { phone_number, password }, undefined, true);
        if (resp.ok && resp.body?.token) {
            localStorage.setItem('admin_token', resp.body.token);
        }
        return resp;
    }

    export async function GetProfile(): Promise<APIResponse<any>> {
        return request("/me", "GET", undefined, getToken());
    }

    export async function ChangePassword(old_password: string, new_password: string): Promise<APIResponse<any>> {
        return request("/auth/change-password", "POST", { old_password, new_password }, getToken());
    }

    export async function Refresh(refresh_token: string): Promise<APIResponse<any>> {
        const resp = await request("/auth/refresh", "POST", { refresh_token }, undefined, true);
        if (resp.ok && resp.body?.token) {
            localStorage.setItem('admin_token', resp.body.token);
        }
        return resp;
    }

    export function Logout() {
        localStorage.removeItem('admin_token');
    }
}

export type { APIResponse };

const getToken = () => localStorage.getItem('admin_token') ?? undefined;

export async function GetAllOrders(): Promise<APIResponse<Order[]>> {
    return request('/admin/orders', 'GET', undefined, getToken());
}

export async function GetOrderById(orderId: string): Promise<APIResponse<Order>> {
    return request(`/admin/orders/${orderId}`, 'GET', undefined, getToken());
}

export async function GetProductById(productId: string): Promise<APIResponse<Product>> {
    return request(`/catalog/products/${productId}`, 'GET', undefined, getToken());
}

// --- Analytics ---

// --- Sellers ---
export const getAllSellers       = () => request('/catalog/brands', 'GET', undefined, undefined, true);
export const adminGetAllSellers  = () => request('/admin/sellers', 'GET', undefined, getToken());
export const adminGetAllInteractions = () => request('/admin/interactions', 'GET', undefined, getToken());

export const getSellerDetails = (sellerId: string) => request(`/admin/sellers/${sellerId}`, 'GET', undefined, getToken());
export const approveSeller    = (sellerId: string) => request(`/admin/sellers/${sellerId}/approve`, 'PUT', {}, getToken());
export const updateSeller     = (sellerId: string, data: any) => request(`/admin/sellers/${sellerId}`, 'PUT', data, getToken());

export const getAllUsers          = () => request('/admin/users', 'GET', undefined, getToken());
export const getUserDetails       = (userId: string) => request(`/admin/users/${userId}`, 'GET', undefined, getToken());
export const getWaitlist          = () => request('/admin/waitlist', 'GET', undefined, getToken());

// --- Products & Queue ---
export const getProductQueue = () => request('/admin/products-queue', 'GET', undefined, getToken());

// --- Orders Extended ---
export const updateOrder      = (orderId: string, data: any) => request(`/admin/orders/${orderId}`, 'PUT', data, getToken());
export const getAllCarts       = () => request('/admin/carts', 'GET', undefined, getToken());

// --- System ---
export const getAllOTPs       = () => request('/admin/otps', 'GET', undefined, getToken());
export const getSystemHealth = () => request('/admin/health', 'GET', undefined, getToken());

// --- Updates ---
export const createUpdate = (data: any) => request('/admin/updates', 'POST', data, getToken());

// --- Notifications ---
export const broadcastNotification = (title: string, body: string, data?: object) =>
    request('/admin/notifications/broadcast', 'POST', {
        title,
        body,
        data: data || { additionalProp1: "string", additionalProp2: "string", additionalProp3: "string" },
    }, getToken());

export const sendNotificationToUser  = (user_id: string, title: string, body: string, data?: object) =>
    request(`/admin/notifications/users/${user_id}/send`, 'POST', { title, body, data }, getToken());
export const deleteNotificationToken = (expo_token: string) =>
    request(`/admin/notifications/tokens/${expo_token}`, 'DELETE', undefined, getToken());
export const deleteUserNotificationTokens = (user_id: string) =>
    request(`/admin/notifications/tokens/user/${user_id}`, 'DELETE', undefined, getToken());

export const createAmbassadorTask = (data: any) => request('/admin/ambassador/tasks', 'POST', data, getToken());
