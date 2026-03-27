import { Order } from "../constants/orders";
import { Product } from "../constants/types";
import { request, API_BASE_URL, APIResponse } from "./core";

export const api_url = API_BASE_URL;

export function setState(data: any) {
    if (data && data.token) {
        localStorage.setItem('admin_token', data.token);
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
    return request(`/api/v1/products/${productId}`, 'GET', undefined, getToken());
}

// --- Analytics ---
export const getAnalyticsSummary = () => request('/api/v1/analytics/summary', 'GET', undefined, getToken());

// --- Sellers ---
export const getAllSellers       = () => request('/api/v1/all-sellers', 'GET', undefined, undefined, true);
export const adminGetAllSellers  = () => request('/admin/sellers', 'GET', undefined, getToken());
export const adminGetAllInteractions = () => request('/admin/interactions', 'GET', undefined, getToken());

export const getSellerDetails = (sellerId: string) => request(`/admin/sellers/${sellerId}`, 'GET', undefined, getToken());
export const approveSeller    = (sellerId: string) => request(`/admin/sellers/${sellerId}/approve`, 'PUT', {}, getToken());
export const updateSeller     = (sellerId: string, data: any) => request(`/admin/sellers/${sellerId}`, 'PUT', data, getToken());

export const getAllUsers          = () => request('/admin/users', 'GET', undefined, getToken());
export const getUserDetails       = (userId: string) => request(`/admin/users/${userId}`, 'GET', undefined, getToken());
export const getAllDeliveryBookings = () => request('/admin/delivery-bookings', 'GET', undefined, getToken());
export const getAllInvites         = () => request('/admin/invites', 'GET', undefined, getToken());
export const getWaitlist          = () => request('/admin/waitlist', 'GET', undefined, getToken());

// --- Products & Queue ---
export const getAllProducts  = () => request('/admin/products', 'GET', undefined, getToken());
export const getProductQueue = () => request('/admin/products-queue', 'GET', undefined, getToken());
export const getEmbeddings   = () => request('/admin/embeddings', 'GET', undefined, getToken());

// --- Orders Extended ---
export const getParentOrders  = () => request('/admin/parent-orders', 'GET', undefined, getToken());
export const getOrderHistory  = (orderId: string) => request(`/admin/orders/${orderId}/history`, 'GET', undefined, getToken());
export const updateOrder      = (orderId: string, data: any) => request(`/admin/orders/${orderId}`, 'PUT', data, getToken());
export const getAllCarts       = () => request('/admin/carts', 'GET', undefined, getToken());

// --- Analytics Extended ---
export const getSalesFunnel     = () => request('/admin/analytics/sales-funnel', 'GET', undefined, getToken());
export const getAnalyticsEvents = () => request('/admin/analytics/events', 'GET', undefined, getToken());

// --- Forms & System ---
export const getChapterForms       = () => request('/admin/chapter-forms', 'GET', undefined, getToken());
export const getNotificationTokens = () => request('/admin/notifications/tokens', 'GET', undefined, getToken());
export const getAllOTPs             = () => request('/admin/otps', 'GET', undefined, getToken());
export const getSystemHealth       = () => request('/admin/health', 'GET', undefined, getToken());
export const createTournament      = (data: any) => request('/admin/tournaments', 'POST', data, getToken());

// --- Invites ---
export const getInvitesByOwner     = (ownerEmail: string) => request(`/api/v1/invites/by-owner?owner=${encodeURIComponent(ownerEmail)}`, 'GET', undefined, getToken());
export const generateInviteForOwner = (ownerEmail: string) => request(`/api/v1/invites/generate?owner=${encodeURIComponent(ownerEmail)}`, 'POST', {}, getToken());

// --- Notifications ---
export const broadcastNotification = (title: string, body: string, data?: object) =>
    request('/admin/notifications/broadcast', 'POST', {
        title,
        body,
        data: data || { additionalProp1: "string", additionalProp2: "string", additionalProp3: "string" },
    }, getToken());

export const createAmbassadorTask = (data: any) => request('/admin/ambassador/tasks', 'POST', data, getToken());
