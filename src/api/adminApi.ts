import { Order } from "../constants/orders";
import { Product } from "../constants/types";
import { API_BASE_URL } from "./core";

/**
 * The base URL for all API requests.
 */
export const api_url = API_BASE_URL;

export function setState(data: any) {
  if (data && data.token) {
    localStorage.setItem('admin_token', data.token);
  }
}

// --- Generic API Response Interface ---
export interface APIResponse<T> {
    status: number;
    ok: boolean;
    body: T;
}

// --- Reusable Helper Functions (Refactored to top-level) ---

/**
 * Parses the JSON body from a Response object.
 * @param resp The Response object.
 * @returns A promise that resolves to the parsed JSON or an empty object on error.
 */
async function parseBody(resp: Response): Promise<any> {
    try {
        return await resp.json();
    } catch {
        return {};
    }
}

const getAuthToken = () => localStorage.getItem('admin_token');


/**
 * Makes an API request with a JSON body.
 * @param url The endpoint URL (e.g., "/users/profile").
 * @param method The HTTP method (e.g., "POST", "PUT").
 * @param data The data to be sent in the request body.
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithBody(url: string, method: string, data: any): Promise<APIResponse<any>> {
    const token = getAuthToken();
    const headers = new Headers({
        "Content-Type": "application/json",
    });

    if (token) {
        headers.append("Authorization", `Bearer ${token}`);
    }

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers,
        body: JSON.stringify(data)
    });

    // token needs to be refreshed
    if (resp.status === 401 && token && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          "refresh_token" : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
            body : JSON.stringify(data),
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

/**
 * Makes an API request without a body.
 * @param url The endpoint URL, including any query parameters.
 * @param method The HTTP method (e.g., "GET", "DELETE").
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithoutBody(url: string, method: string): Promise<APIResponse<any>> {
    const token = getAuthToken();
    const headers = new Headers();

    if (token) {
        headers.append("Authorization", `Bearer ${token}`);
    }

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers
    });

    // token needs to be refreshed
    if (resp.status === 401 && token && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          refresh_token : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

// New helper for public endpoints that do not require an Authorization header.
async function publicRequestWithoutBody(url: string, method: string): Promise<APIResponse<any>> {
    const resp = await fetch(`${api_url}${url}`, {
        method
    });

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

export async function GetAllOrders() : Promise<APIResponse<Order[]>> {
  return requestWithoutBody('/admin/orders', 'GET');
}  

export async function GetOrderById(orderId: string): Promise<APIResponse<Order>> {
  return requestWithoutBody(`/admin/orders/${orderId}`, 'GET');
}

export async function GetProductById(productId: string): Promise<APIResponse<Product>> {
  return requestWithoutBody(`/api/v1/products/${productId}`, 'GET');
}


// --- Analytics ---
export const getAnalyticsSummary = () => requestWithoutBody('/api/v1/analytics/summary', 'GET');

// --- Sellers ---
export const getAllSellers = () => publicRequestWithoutBody('/api/v1/all-sellers', 'GET');
export const adminGetAllSellers = () => requestWithoutBody('/admin/sellers', 'GET');
export const adminGetAllInteractions = () => requestWithoutBody('/admin/interactions', 'GET');

export const getSellerDetails = (sellerId: string) => requestWithoutBody(`/admin/sellers/${sellerId}`, 'GET');
export const approveSeller = (sellerId: string) => requestWithBody(`/admin/sellers/${sellerId}/approve`, 'PUT', {});
export const updateSeller = (sellerId: string, data: any) => requestWithBody(`/admin/sellers/${sellerId}`, 'PUT', data);

export const getAllUsers = () => requestWithoutBody('/admin/users', 'GET');
export const getUserDetails = (userId: string) => requestWithoutBody(`/admin/users/${userId}`, 'GET');
export const getAllDeliveryBookings = () => requestWithoutBody('/admin/delivery-bookings', 'GET');
export const getAllInvites = () => requestWithoutBody('/admin/invites', 'GET');
export const getWaitlist = () => requestWithoutBody('/admin/waitlist', 'GET');

// --- Products & Queue ---
export const getAllProducts = () => requestWithoutBody('/admin/products', 'GET');
export const getProductQueue = () => requestWithoutBody('/admin/products-queue', 'GET');
export const getEmbeddings = () => requestWithoutBody('/admin/embeddings', 'GET');

// --- Orders Extended ---
export const getParentOrders = () => requestWithoutBody('/admin/parent-orders', 'GET');
export const getOrderHistory = (orderId: string) => requestWithoutBody(`/admin/orders/${orderId}/history`, 'GET');
export const updateOrder = (orderId: string, data: any) => requestWithBody(`/admin/orders/${orderId}`, 'PUT', data);
export const getAllCarts = () => requestWithoutBody('/admin/carts', 'GET');

// --- Analytics Extended ---
export const getSalesFunnel = () => requestWithoutBody('/admin/analytics/sales-funnel', 'GET');
export const getAnalyticsEvents = () => requestWithoutBody('/admin/analytics/events', 'GET');

// --- Forms & System ---
export const getChapterForms = () => requestWithoutBody('/admin/chapter-forms', 'GET');
export const getNotificationTokens = () => requestWithoutBody('/admin/notifications/tokens', 'GET');
export const getAllOTPs = () => requestWithoutBody('/admin/otps', 'GET');
export const getSystemHealth = () => requestWithoutBody('/admin/health', 'GET');
export const createTournament = (data: any) => requestWithBody('/admin/tournaments', 'POST', data);

// --- Invites ---
export const getInvitesByOwner = (ownerEmail: string) => requestWithoutBody(`/api/v1/invites/by-owner?owner=${encodeURIComponent(ownerEmail)}`, 'GET');
export const generateInviteForOwner = (ownerEmail: string) => requestWithBody(`/api/v1/invites/generate?owner=${encodeURIComponent(ownerEmail)}`, 'POST', {});

// --- Notifications ---
export const broadcastNotification = (title: string, body: string, data?: object) => {
  return requestWithBody('/admin/notifications/broadcast', 'POST', {
    title,
    body,
    data: data || {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  });
};

export const createAmbassadorTask = (data: any) => requestWithBody('/admin/ambassador/tasks', 'POST', data);