// src/api/chapterApi.ts
// --- API Configuration ---
const api_urls = {
    testing: "http://192.168.18.96:8080/api/v1",
    production: "https://junoapi-1095577467512.asia-south2.run.app/api/v1",
    recsystem : "https://junorecsys-710509977105.asia-south2.run.app",
};

const API_BASE_URL = api_urls.production;

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
