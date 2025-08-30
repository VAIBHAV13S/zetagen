// Backend API endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://zetaforge-backend.onrender.com/api' 
    : 'http://localhost:5000/api');

// Debug environment variables
console.log('🔧 API Configuration:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  MODE: import.meta.env.MODE,
  final_API_BASE_URL: API_BASE_URL
});

export const API_ENDPOINTS = {
  generateAsset: `${API_BASE_URL}/generate-asset`,
  getAssets: `${API_BASE_URL}/assets`,
  mintAsset: `${API_BASE_URL}/mint`,
  suggestPrompts: `${API_BASE_URL}/suggest`,
}

// Helper function to call backend APIs
export async function callEdgeFunction(endpoint: string, data?: any) {
  try {
    console.log('API call to:', endpoint, 'with data:', data);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}