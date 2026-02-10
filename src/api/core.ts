export const api_urls = {
    testing: "http://localhost:8080/api/v1",
    production: "https://junoapi-1095577467512.asia-south2.run.app/api/v1",
    recsystem : "https://junorecsys-710509977105.asia-south2.run.app/api/v1",
};

export const API_BASE_URL = api_urls.production;

export interface APIResponse<T> {
    status: number;
    ok: boolean;
    body: T;
}

export function setAuthToken(token: string) {
    if (token) {
        localStorage.setItem('token', token);
    }
}

export function getAuthToken() {
    return localStorage.getItem('token');
}

async function parseBody(resp: Response): Promise<any> {
    try {
        return await resp.json();
    } catch {
        return {};
    }
}

async function handleRefreshToken(failedRequest: () => Promise<Response>, token: string): Promise<Response> {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "refresh_token": token })
    });

    if (!refreshResponse.ok) {
        throw new Error("Login Token Expired");
    }

    const body = await parseBody(refreshResponse);
    setAuthToken(body.token);
    
    // Retry the original request with the new token
    return await failedRequest();
}

export async function request<T>(
    endpoint: string, 
    method: string, 
    data?: any, 
    token?: string, 
    isPublic: boolean = false
): Promise<APIResponse<T>> {
    const headers = new Headers();
    if (!isPublic) {
        const authToken = token || getAuthToken();
        if (authToken) {
            headers.append("Authorization", `Bearer ${authToken}`);
        }
    }

    if (data && !(data instanceof FormData)) {
        headers.append("Content-Type", "application/json");
    }

    const config: RequestInit = {
        method,
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data)
    };

    let resp = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (resp.status === 401 && !isPublic && token) {
        try {
            resp = await handleRefreshToken(() => {
                const newHeaders = new Headers(headers);
                newHeaders.set("Authorization", `Bearer ${getAuthToken()}`);
                return fetch(`${API_BASE_URL}${endpoint}`, { ...config, headers: newHeaders });
            }, token);
        } catch (e) {
            return {
                status: 401,
                ok: false,
                body: { message: "Login Token Expired" } as any
            };
        }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}
