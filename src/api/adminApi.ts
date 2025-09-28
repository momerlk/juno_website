import { Order } from "../constants/orders";
import { Product } from "../constants/types";

// --- API Configuration ---
const api_urls = {
    testing: "http://192.168.18.6:8080/api/v1",
    production: "https://junoapi-710509977105.asia-south2.run.app/",

};

/**
 * The base URL for all API requests.
 */
export const api_url = api_urls.production;

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

export const getSellerDetails = (sellerId: string) => requestWithoutBody(`/admin/sellers/${sellerId}`, 'GET');
export const getAllUsers = () => requestWithoutBody('/admin/users', 'GET');
export const getUserDetails = (userId: string) => requestWithoutBody(`/admin/users/${userId}`, 'GET');
export const getAllDeliveryBookings = () => requestWithoutBody('/admin/delivery-bookings', 'GET');
export const getAllInvites = () => requestWithoutBody('/admin/invites', 'GET');
// NOTE: No endpoints found for approving/rejecting sellers in the swagger file.

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