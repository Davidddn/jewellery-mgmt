import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

// API client with interceptors
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Adding token to request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🚫 401 Unauthorized - clearing auth state');
      localStorage.removeItem('token');
      // Don't redirect here, let the component handle it
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth state...');
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          console.log('🔍 Found token, verifying...');
          // Verify token is still valid
          const response = await api.get('/auth/verify');
          if (response.data.success && response.data.user) {
            console.log('✅ Token verified, user authenticated');
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid verification response');
          }
        } catch (error) {
          console.log('❌ Token verification failed:', error.message);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log('ℹ️ No token found');
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await api.post('/auth/login', credentials);
      
      console.log('📥 Full login response:', response.data);
      
      const { success, token, user: userData } = response.data;

      if (success && token && userData) {
        console.log('✅ Login API successful:', { 
          token: token ? 'Present' : 'Missing', 
          user: userData.username || userData.firstName 
        });

        // Store token
        localStorage.setItem('token', token);
        console.log('💾 Token stored in localStorage');

        // Update context state
        setUser(userData);
        setIsAuthenticated(true);
        console.log('🔄 Auth state updated:', { 
          user: userData.username || userData.firstName, 
          isAuthenticated: true 
        });

        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { api };