import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Fetch user error:', error);
      // Only logout if it's definitely an authentication error (not network/server issues)
      if (error.response?.status === 401) {
        logout();
      }
      // For other errors (network, server), keep the user state and retry later
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (email, password) => {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      }, {
        timeout: 10000, // 10 second timeout
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed. Invalid response from server.',
        };
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      // Better error handling for network issues
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timed out. Please check your internet connection and try again.',
        };
      }
      
      if (!error.response) {
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          return {
            success: false,
            message: 'Unable to connect to server. Please make sure the backend server is running on port 5000.',
          };
        }
        return {
          success: false,
          message: 'Network error. Please check if the backend server is running.',
        };
      }
      
      // Handle different HTTP status codes
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      
      if (status === 401) {
        return {
          success: false,
          message: 'Invalid email or password. Please check your credentials.',
        };
      }
      
      return {
        success: false,
        message: message,
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Attempting registration to:', `${API_URL}/auth/register`);
      console.log('Registration data:', { ...userData, password: '***' });
      
      const response = await axios.post(`${API_URL}/auth/register`, userData, {
        timeout: 10000, // 10 second timeout
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed. Invalid response from server.',
        };
      }
    } catch (error) {
      console.error('Registration error details:', error);
      
      // Better error handling for network issues
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return {
          success: false,
          message: 'Request timed out. Please check your internet connection and try again.',
        };
      }
      
      if (!error.response) {
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          return {
            success: false,
            message: 'Unable to connect to server. Please make sure the backend server is running on port 5000.',
          };
        }
        return {
          success: false,
          message: 'Network error. Please check if the backend server is running.',
        };
      }
      
      // Handle different HTTP status codes
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      
      if (status === 400) {
        return {
          success: false,
          message: message || 'Invalid registration data. Please check all fields.',
        };
      }
      
      return {
        success: false,
        message: message,
      };
    }
  };

  const refreshAuth = async () => {
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/auth/me`);
        setUser(response.data.user);
        return true;
      } catch (error) {
        console.error('Refresh auth error:', error);
        logout();
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

