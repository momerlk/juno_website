const BASE_URL = 'https://junoapi-710509977105.asia-south2.run.app/api/v1';

const getAuthToken = () => localStorage.getItem('admin_token');

const makeRequest = async (path: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An API error occurred');
  }

  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// --- Analytics ---
export const getAnalyticsSummary = () => makeRequest('/analytics/summary');

// --- Sellers ---
export const getAllSellers = () => makeRequest('/all-sellers');
// NOTE: No endpoints found for approving/rejecting sellers in the swagger file.

// --- Invites ---
export const getInvitesByOwner = (ownerEmail: string) => makeRequest(`/invites/by-owner?owner=${encodeURIComponent(ownerEmail)}`);
export const generateInviteForOwner = (ownerEmail: string) => makeRequest(`/invites/generate?owner=${encodeURIComponent(ownerEmail)}`, { method: 'POST' });

// --- Notifications ---
export const broadcastNotification = (title: string, body: string, data?: object) => {
  return makeRequest('/admin/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify({ title : title, body : body, data: data || {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  } }),
  });
};
