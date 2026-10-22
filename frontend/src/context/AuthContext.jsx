import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stockflow_access_token');
    if (token) {
      axiosClient.get('/users/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('stockflow_user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await axiosClient.post('/auth/login', { username, password });
    const { accessToken, refreshToken, user: userData } = res.data;
    localStorage.setItem('stockflow_access_token', accessToken);
    localStorage.setItem('stockflow_refresh_token', refreshToken);
    localStorage.setItem('stockflow_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const quickLogin = async (role) => {
    let username = 'admin';
    let password = 'Admin@123';
    if (role === 'MANAGER') {
      username = 'manager';
      password = 'Demo@123';
    } else if (role === 'STAFF') {
      username = 'staff';
      password = 'Demo@123';
    } else if (role === 'ANALYST') {
      username = 'analyst';
      password = 'Demo@123';
    }
    return login(username, password);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('stockflow_refresh_token');
    try {
      if (refreshToken) {
        await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('stockflow_access_token');
      localStorage.removeItem('stockflow_refresh_token');
      localStorage.removeItem('stockflow_user');
      setUser(null);
    }
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const canWrite = () => hasRole('ADMIN', 'MANAGER');
  const canTransact = () => hasRole('ADMIN', 'MANAGER', 'STAFF');
  const isAdmin = () => hasRole('ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        quickLogin,
        logout,
        hasRole,
        canWrite,
        canTransact,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
