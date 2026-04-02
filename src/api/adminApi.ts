import { Order } from "../constants/orders";
import { Product } from "../constants/types";
import { request, API_BASE_URL, APIResponse, APIError } from "./core";

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
        refresh_token?: string;
        user?: {
            id: string;
            name: string;
            email?: string;
            role: string;
        };
    }

    export async function Login(phone_number: string, password: string): Promise<APIResponse<LoginResponse>> {
        const resp = await request<LoginResponse>("/auth/login", "POST", { phone_number, password }, undefined, true);
        if (resp.ok && !isError(resp.body) && resp.body?.token) {
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

    export async function Refresh(refresh_token: string): Promise<APIResponse<LoginResponse>> {
        const resp = await request<LoginResponse>("/auth/refresh", "POST", { refresh_token }, undefined, true);
        if (resp.ok && !isError(resp.body) && resp.body?.token) {
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
export const getAllSellers       = (): Promise<APIResponse<any[]>> => request('/catalog/brands', 'GET', undefined, undefined, true);
export const adminGetAllSellers  = (): Promise<APIResponse<any[]>> => request('/admin/sellers', 'GET', undefined, getToken());
export const adminGetAllInteractions = (): Promise<APIResponse<any[]>> => request('/admin/interactions', 'GET', undefined, getToken());

export const getSellerDetails = (sellerId: string): Promise<APIResponse<any>> => request(`/admin/sellers/${sellerId}`, 'GET', undefined, getToken());
export const approveSeller    = (sellerId: string): Promise<APIResponse<any>> => request(`/admin/sellers/${sellerId}/approve`, 'PUT', {}, getToken());
export const updateSeller     = (sellerId: string, data: any): Promise<APIResponse<any>> => request(`/admin/sellers/${sellerId}`, 'PUT', data, getToken());

export const getAllUsers          = (): Promise<APIResponse<any[]>> => request('/admin/users', 'GET', undefined, getToken());
export const getUserDetails       = (userId: string): Promise<APIResponse<any>> => request(`/admin/users/${userId}`, 'GET', undefined, getToken());
export const getWaitlist          = (): Promise<APIResponse<any[]>> => request('/admin/waitlist', 'GET', undefined, getToken());

// --- Products & Queue ---
export const getProductQueue = (): Promise<APIResponse<any[]>> => request('/admin/products-queue', 'GET', undefined, getToken());

// --- Orders Extended ---
export const updateOrder      = (orderId: string, data: any): Promise<APIResponse<any>> => request(`/admin/orders/${orderId}`, 'PUT', data, getToken());
export const getAllCarts       = (): Promise<APIResponse<any[]>> => request('/admin/carts', 'GET', undefined, getToken());

// --- System ---
export const getAllOTPs       = (): Promise<APIResponse<any[]>> => request('/admin/otps', 'GET', undefined, getToken());
export const getSystemHealth = (): Promise<APIResponse<any>> => request('/admin/health', 'GET', undefined, getToken());

// --- Updates ---
export const createUpdate = (data: any): Promise<APIResponse<any>> => request('/admin/updates', 'POST', data, getToken());

// --- Notifications ---
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
