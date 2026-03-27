import { request, API_BASE_URL } from "./core";

export const API_BASE = API_BASE_URL;

const getToken = () => localStorage.getItem('work_token') ?? undefined;

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const method = (options.method as string | undefined) || 'GET';
    let data: any;
    if (options.body && typeof options.body === 'string') {
        try { data = JSON.parse(options.body); } catch { /* leave data undefined */ }
    }
    const resp = await request(endpoint, method, data, getToken());
    if (!resp.ok) {
        throw new Error((resp.body as any)?.message || `API Error: ${resp.status}`);
    }
    return resp.status === 204 ? null : resp.body;
};
