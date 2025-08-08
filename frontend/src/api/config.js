import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
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