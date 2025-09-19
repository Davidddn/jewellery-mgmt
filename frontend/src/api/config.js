import axios from 'axios';

// Export the API base URL
export const API_BASE_URL = import.meta.env.PROD 
    ? '' 
    : import.meta.env.VITE_API_URL || '';

console.log('API Config - Mode:', import.meta.env.MODE);
console.log('API Config - Base URL:', API_BASE_URL);
console.log('API Config - Full Base URL:', `${API_BASE_URL}/api`);

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 30000, // Increased back to 30000ms to prevent timeouts
});

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    console.log('API Request - URL:', config.url);
    console.log('API Request - Base URL:', config.baseURL);
    console.log('API Request - Full URL:', config.baseURL + config.url);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 errors once and prevent loops
    if (error.response?.status === 401 && !isRedirecting) {
      console.log('API interceptor: 401 error, clearing auth and redirecting');
      isRedirecting = true;
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // Reset the flag after a delay to prevent immediate loops
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;