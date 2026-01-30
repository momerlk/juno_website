// src/api/chapterApi.ts
// --- API Configuration ---
import { API_BASE_URL } from "./core";

/**
 * The base URL for all API requests.
 */
export const api_url = API_BASE_URL;

const getAuthToken = () => localStorage.getItem('ambassador_token');

async function requestWithAuth(url: string, method: string = 'GET', body?: any) {
  const token = getAuthToken();
  const headers: any = {
      'Content-Type': 'application/json',
  };
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  const config: any = { method, headers };
  if (body) {
      config.body = JSON.stringify(body);
  }

  console.log(`[API REQUEST] ${method} ${API_BASE_URL}${url}`, config);

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  console.log(`[API RESPONSE STATUS] ${response.status} for ${url}`);

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API Error' }));
      console.error(`[API ERROR] ${url}:`, errorData);
      throw new Error(errorData.message || `Error ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`[API RESPONSE BODY] ${url}:`, data);
  return data;
}

export const submitChapterApplication = async (formData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chapter-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
      alert(errorData.message || `API Error: ${response.status}`)
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    alert("Chapter submission failed")
    console.error('Chapter application submission failed:', error);
    throw error;
  }
};

// --- New Ambassador Endpoints ---

export const getInstituteRanking = async () => {
  const url = '/ambassador/ranking';
  console.log(`[API REQUEST] GET ${API_BASE_URL}${url}`);
  const response = await fetch(`${API_BASE_URL}${url}`);
  if (!response.ok) {
      console.error(`[API ERROR] ${url} ${response.status}`);
      throw new Error('Failed to fetch ranking');
  }
  const data = await response.json();
  console.log(`[API RESPONSE BODY] ${url}:`, data);
  return data;
};

export const getAmbassadorData = async (phoneNumber: string) => {
  const url = `/ambassador/data?phone_number=${encodeURIComponent(phoneNumber)}`;
  console.log(`[API REQUEST] GET ${API_BASE_URL}${url}`);
  const response = await fetch(`${API_BASE_URL}${url}`);
  
  console.log(`[API RESPONSE STATUS] ${response.status} for ${url}`);

  if (!response.ok) {
      console.error(`[API ERROR] ${url} ${response.status}`);
      throw new Error('Failed to fetch ambassador data');
  }
  const data = await response.json();
  console.log(`[API RESPONSE BODY] ${url}:`, data);
  return data;
};

export const getMyTeam = async () => {
  return requestWithAuth('/ambassador/team');
};

export const getAmbassadorTasks = async () => {
  return requestWithAuth('/ambassador/tasks');
};

