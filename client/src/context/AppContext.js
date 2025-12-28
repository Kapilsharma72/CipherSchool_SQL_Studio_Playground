import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, learningAssistantService } from '../services/apiService';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authService.getProfile(token);
          if (response && response.data && response.data.user) {
            setUser(response.data.user);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

    const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      if (response && response.token && response.data && response.data.user) {
        localStorage.setItem('token', response.token);
        setUser(response.data.user);
        setError(null);
        return { token: response.token, user: response.data.user };
      }
      throw new Error('Invalid response from server');
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

    const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      if (response && response.token && response.data && response.data.user) {
        const { token, data: { user } } = response;
        localStorage.setItem('token', token);
        setUser(user);
        setError(null);
        return { token, user };
      }
      throw new Error('Invalid response from server');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

    const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

    const getHint = async (question, context = {}) => {
    try {
      const token = localStorage.getItem('token');
      const data = await learningAssistantService.getHint(
        { userQuestion: question, ...context },
        token
      );
      return data;
    } catch (err) {
      setError(err.message || 'Failed to get hint');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        getHint,
        isAuthenticated: !!user,
      }}
    >
      {!loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
