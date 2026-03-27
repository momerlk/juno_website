import { request, API_BASE_URL, createEvent } from "./core";

export const api_url = API_BASE_URL;

const getToken = () => localStorage.getItem('ambassador_token') ?? undefined;

async function requestWithAuth(url: string, method: string = 'GET', body?: any) {
    const resp = await request(url, method, body, getToken());
    if (!resp.ok) {
        throw new Error((resp.body as any)?.message || `Error ${resp.status}`);
    }
    return resp.body;
}

export const submitChapterApplication = async (formData: any) => {
    const resp = await request('/chapter-applications', 'POST', formData, undefined, true);
    if (!resp.ok) {
        const msg = (resp.body as any)?.message || `API Error: ${resp.status}`;
        alert(msg);
        throw new Error(msg);
    }
    return resp.body;
};

export const trackDownloadVisit = async (ip: string, os: string) => {
    try {
        await createEvent('download_page_visit', { url: window.location.href, ip, os });
    } catch (error) {
        console.error('Failed to track download visit:', error);
    }
};

export const loginAmbassador = async (phoneNumber: string) => {
    const resp = await request('/ambassador/login', 'POST', { phone_number: phoneNumber }, undefined, true);
    if (!resp.ok) {
        throw new Error((resp.body as any)?.message || 'Login Failed');
    }
    return resp.body;
};

export const getAmbassadorDashboard = async () => requestWithAuth('/ambassador/dashboard');

export const getInstituteRanking = async () => {
    const resp = await request('/ambassador/ranking', 'GET', undefined, undefined, true);
    if (!resp.ok) throw new Error('Failed to fetch ranking');
    return resp.body;
};

export const getAmbassadorData = async (phoneNumber: string) => {
    const resp = await request(`/ambassador/data?phone_number=${encodeURIComponent(phoneNumber)}`, 'GET', undefined, undefined, true);
    if (!resp.ok) throw new Error('Failed to fetch ambassador data');
    return resp.body;
};

export const getMyTeam            = async () => requestWithAuth('/ambassador/team');
export const getAmbassadorTasks   = async () => requestWithAuth('/ambassador/tasks');
export const getInstituteUsers    = async () => requestWithAuth('/ambassador/users');
export const getAmbassadorReports = async () => requestWithAuth('/ambassador/reports');

export const submitWeeklyReport = async (report: {
    week_number: number;
    tasks_summary: string;
    proof_files: string[];
}) => {
    const resp = await request('/ambassador/reports', 'POST', report, getToken());
    if (!resp.ok) {
        throw new Error((resp.body as any)?.message || 'Failed to submit report');
    }
    return resp.body;
};
