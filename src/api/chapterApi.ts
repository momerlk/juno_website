// src/api/chapterApi.ts

const API_BASE_URL = 'https://junoapi-710509977105.asia-south2.run.app/api/v1';

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
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chapter application submission failed:', error);
    throw error;
  }
};
