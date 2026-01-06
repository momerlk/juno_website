// src/api/workApi.ts

const API_BASE = "https://junoapi-1095577467512.asia-south2.run.app/api/v1";

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('work_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
