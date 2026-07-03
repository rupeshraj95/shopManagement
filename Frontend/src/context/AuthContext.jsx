import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure institutional API defaults for secure session handling
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Poll server verification endpoints instantly on system initialization
  useEffect(() => {
    const initializeAuthSession = async () => {
      try {
        const response = await axios.get('/auth/me').catch(() => null);
        if (response && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initializeAuthSession();
  }, []);

  /**
   * Commits operator credentials directly to backend system routers
   * @param {string} email 
   * @param {string} password 
   */
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Access credentials refused by security gateway.'
      };
    }
  };

  /**
   * Clears institutional session references on database repositories and client side
   */
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Session clearance connection timed out on server pipeline.');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth loop evaluated completely outside of a stable AuthProvider hierarchy block.');
  }
  return context;
};