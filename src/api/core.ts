/**
 * Core API utilities
 * 
 * Handles authentication, request/response transformation, and token refresh.
 * All API requests flow through this module.
 */

export const api_urls = {
    testing: "http://localhost:8080/api/v2",
    production: "https://apijuno-3oztvkyxua-em.a.run.app/api/v2",
    recsystem: "https://junorecsys-710509977105.asia-south2.run.app/api/v2",
};

// Environment-aware API URL configuration
let base_url = api_urls.production;
if (import.meta.env.VITE_API_URL) {
    base_url = import.meta.env.VITE_API_URL;
} else if (import.meta.env.VITE_DEBUG === "true") {
    base_url = api_urls.testing;
}

console.log(`API Base URL: ${base_url}`);

export const API_BASE_URL = base_url;
export const RECSYSTEM_BASE_URL = "https://junorecsys-710509977105.asia-south2.run.app";

/**
 * API Response wrapper
 * 
 * All API responses follow this structure regardless of success/failure.
 * 
 * @template T - The expected data type for successful responses
 */
export interface APIResponse<T> {
    /** HTTP status code */
    status: number;
    /** True if request succeeded (2xx status code) */
    ok: boolean;
    /** 
     * Response body.
     * - On success: unwrapped data (T)
     * - On error: error object with message and code
     */
    body: T | APIError;
}

/**
 * API Error structure
 * 
 * All errors returned by the API follow this format.
 */
export interface APIError {
    /** Human-readable error message */
    message: string;
    /** Error code for programmatic handling (e.g., "INVALID_BODY", "NOT_FOUND") */
    code?: string;
    /** Additional error details if available */
    details?: any;
}

export function setAuthToken(token: string) {
    if (token) {
        localStorage.setItem('token', token);
    }
}

export function getAuthToken() {
    // Check the direct token key first (user auth)
    const direct = localStorage.getItem('token');
    if (direct) return direct;

    // Fall back to seller session (stored as JSON { token, user })
    const sellerRaw = localStorage.getItem('seller');
    if (sellerRaw) {
        try { return JSON.parse(sellerRaw).token as string || null; }
        catch { return null; }
    }

    return null;
}

/**
 * Parse response body with error handling
 * 
 * Returns empty object on parse failure, logs error in development mode.
 */
async function parseBody(resp: Response): Promise<any> {
    try {
        const text = await resp.text();
        if (!text) return {};
        return JSON.parse(text);
    } catch (e) {
        // Log parse errors in development for debugging
        if (import.meta.env.DEV) {
            console.warn('Failed to parse response:', resp.url, e);
        }
        return {};
    }
}

/**
 * Unwrap successful API response
 * 
 * The API returns all responses in the format:
 * { success: true, data: <actual_data> }
 * 
 * This function extracts the data field.
 */
function unwrapSuccessBody(body: any): any {
    // Handle standard API response format: { success: true, data: ... }
    if (body && typeof body === "object") {
        if ("success" in body && body.success === true && "data" in body) {
            return body.data;
        }
        // Fallback: if only data field exists (no success field)
        if ("data" in body && !("error" in body)) {
            return body.data;
        }
    }
    return body;
}

/**
 * Unwrap error response
 * 
 * Error responses follow the format:
 * { success: false, error: { message: "...", code: "..." } }
 * or
 * { error: { message: "...", code: "..." } }
 * or
 * { message: "..." }
 */
function unwrapErrorBody(body: any): APIError {
    if (body && typeof body === "object") {
        // Handle { success: false, error: { message, code } }
        if (body.error && typeof body.error === "object") {
            return {
                message: body.error.message || "An error occurred",
                code: body.error.code,
                details: body.error.details
            };
        }
        // Handle { message, code } at root level (but not if it looks like success data)
        if (body.message && !body.data) {
            return {
                message: body.message,
                code: body.code,
                details: body.details
            };
        }
        // Handle { success: false, data: { message } } (error in data field)
        if (body.success === false && body.data && typeof body.data === "object" && body.data.message) {
            return {
                message: body.data.message,
                code: body.data.code,
                details: body.data.details
            };
        }
    }
    
    // Fallback for unknown error formats
    return {
        message: typeof body === "string" ? body : "An unexpected error occurred",
        code: "UNKNOWN_ERROR"
    };
}

/**
 * Check if body is an API error
 * 
 * Type guard for narrowing APIResponse body type.
 */
export function isAPIError(body: any): body is APIError {
    return body && typeof body === "object" && 
           "message" in body && typeof body.message === "string" &&
           // Exclude typical data fields that might have 'message'
           !("id" in body) && !("created_at" in body) && !("updated_at" in body);
}

// Token refresh deduplication - prevents multiple concurrent refresh requests
let refreshPromise: Promise<string> | null = null;

/**
 * Get or queue a token refresh
 * 
 * Deduplicates concurrent refresh requests to prevent race conditions.
 */
function getOrQueueTokenRefresh(refreshToken: string): Promise<string> {
    if (!refreshPromise) {
        refreshPromise = new Promise<string>((resolve, reject) => {
            fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "refresh_token": refreshToken })
            })
            .then(async (resp) => {
                if (!resp.ok) {
                    throw new Error("Login Token Expired");
                }
                const body = unwrapSuccessBody(await parseBody(resp));
                const newToken = body?.token;
                if (newToken) {
                    setAuthToken(newToken);
                    resolve(newToken);
                } else {
                    reject(new Error("No token in refresh response"));
                }
            })
            .catch(reject)
            .finally(() => {
                refreshPromise = null;
            });
        });
    }
    return refreshPromise;
}

/**
 * Make an API request
 * 
 * Handles authentication, request/response transformation, and token refresh.
 * 
 * @param endpoint - API endpoint path (e.g., "/catalog/products")
 * @param method - HTTP method
 * @param data - Request body (will be JSON.stringify'd unless FormData)
 * @param token - Optional auth token (uses localStorage if omitted)
 * @param isPublic - If true, no auth header is sent
 * @param timeout - Request timeout in ms (default: 30000)
 * @returns APIResponse<T> with unwrapped body
 */
export async function request<T>(
    endpoint: string,
    method: string,
    data?: any,
    token?: string,
    isPublic: boolean = false,
    timeout: number = 30000
): Promise<APIResponse<T>> {
    const headers = new Headers();
    const authToken = token || getAuthToken();
    
    if (!isPublic && authToken) {
        headers.append("Authorization", `Bearer ${authToken}`);
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (data && !(data instanceof FormData)) {
        headers.append("Content-Type", "application/json");
    }

    const config: RequestInit = {
        method,
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data),
        signal: AbortSignal.timeout(timeout)
    };

    let resp: Response;
    
    try {
        resp = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (e) {
        // Handle network errors (DNS, connection reset, timeout)
        const errorMessage = e instanceof Error ? e.message : "Network error";
        const errorCode = errorMessage.includes('timeout') ? 'TIMEOUT' : 'NETWORK_ERROR';
        return {
            status: 0,
            ok: false,
            body: { message: `Request failed: ${errorMessage}`, code: errorCode } as APIError
        };
    }

    // Handle 401 Unauthorized with token refresh
    // This works for both explicit token parameter and localStorage tokens
    if (resp.status === 401 && !isPublic && authToken) {
        try {
            // Use deduplicated refresh to prevent race conditions
            await getOrQueueTokenRefresh(authToken);
            
            // Retry the original request with the new token from localStorage
            const newAuthToken = getAuthToken();
            if (newAuthToken) {
                const retryHeaders = new Headers(headers);
                retryHeaders.set("Authorization", `Bearer ${newAuthToken}`);
                resp = await fetch(`${API_BASE_URL}${endpoint}`, {
                    ...config,
                    headers: retryHeaders
                });
            }
        } catch (e) {
            // Refresh failed - clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('seller_token');
            
            return {
                status: 401,
                ok: false,
                body: { message: "Login Token Expired", code: "TOKEN_EXPIRED" } as APIError
            };
        }
    }

    const body = await parseBody(resp);
    
    // Check for explicit success field in response
    const isSuccess = resp.ok || (body && body.success === true);
    
    return {
        status: resp.status,
        ok: isSuccess,
        body: isSuccess ? unwrapSuccessBody(body) : unwrapErrorBody(body)
    };
}

export async function createEvent(name: string, data: any): Promise<boolean> {
    const resp = await request('/events', 'POST', { name, data }, undefined, true);
    return resp.ok;
}
