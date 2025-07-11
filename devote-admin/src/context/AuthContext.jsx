import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const UseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Attempting login...'); // Debug log
      
      const response = await apiService.adminLogin(credentials);
      
      console.log('AuthContext: Login response:', response); // Debug log
      
      setIsAuthenticated(true);
      return { success: true, data: response };
    } catch (error) {
      console.error('AuthContext: Login error:', error); // Debug log
      
      setIsAuthenticated(false);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};