// API Configuration for different environments
const getApiBaseUrl = (): string => {
  // In production, use the same origin (relative URLs)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use the local server
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (baseUrl === '') {
    return `/api${cleanEndpoint}`;
  }
  
  return `${baseUrl}/api${cleanEndpoint}`;
};

// Export for backwards compatibility
export default API_BASE_URL; 