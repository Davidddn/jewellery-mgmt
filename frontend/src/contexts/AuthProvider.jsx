import { useState, useEffect, useCallback, useRef } from 'react';
import AuthContext from './authContext.js';
import api from '../api/config';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use ref to prevent unnecessary re-renders
  const initializationRef = useRef(false);

  // Define all hooks at the top level, before any conditional logic
  const handleLogout = useCallback(() => {
    console.log('AuthProvider: handleLogout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  const handleLogin = useCallback(async (token, userData) => {
    console.log('AuthProvider: handleLogin called with user:', userData);
    
    if (!token || !userData) {
      console.error('AuthProvider: Invalid token or userData provided');
      return;
    }
    
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      console.log('AuthProvider: Login successful, user state updated');
    } catch (error) {
      console.error('AuthProvider: Error during login:', error);
      handleLogout();
    }
  }, [handleLogout]);

  const handleRegister = useCallback(async (credentials) => {
    console.log('AuthProvider: handleRegister called');
    try {
      const response = await api.post('/auth/register', credentials);
      
      if (response.data.success && response.data.token && response.data.user) {
        console.log('AuthProvider: Registration successful');
        await handleLogin(response.data.token, response.data.user);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("AuthProvider: Registration failed:", error.response?.data?.message || error.message);
      throw error; // Re-throw to let the component handle it
    }
  }, [handleLogin]);

  // Initialize auth state only once
  useEffect(() => {
    const initAuth = () => {
      if (initializationRef.current) {
        console.log('AuthProvider: Already initialized, skipping');
        return;
      }
      
      console.log('AuthProvider: Initializing authentication state');
      initializationRef.current = true;
      
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('AuthProvider: Restoring user from localStorage:', parsedUser);
          
          setUser(parsedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('AuthProvider: Failed to restore auth state:', error);
          // Clear corrupted data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('AuthProvider: No saved auth state found');
      }
      
      setLoading(false);
      setIsInitialized(true);
    };

    initAuth();
  }, []); // Empty dependency array - run only once

  // Prevent rendering children until initialized
  if (!isInitialized) {
    return null; // or a loading spinner
  }

  // Create context value object first
  const contextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister  // Add the register function to context
  };

  // Use the contextValue object for logging
  console.log('AuthProvider: Rendering with value:', { 
    user: user?.username, 
    loading, 
    isAuthenticated: !!user 
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};