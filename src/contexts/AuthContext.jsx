import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE));
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login for:', username);
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        username,
        password,
      });

      console.log('✅ Login response:', response.data);

      const { token: newToken, username: userName, role } = response.data;

      // Create user object from response
      const userData = {
        username: userName,
        role: role,
        name: userName // Use username as display name
      };

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      console.log('✅ Login successful, user set:', userData);
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
