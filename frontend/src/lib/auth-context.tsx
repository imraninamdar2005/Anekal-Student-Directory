'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface User {
  id?: number;
  username: string;
  full_name: string;
  role: 'Admin' | 'Data Manager' | 'Viewer' | string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  canEdit: boolean;
  canAdmin: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('anekal_token');
      const storedUser = localStorage.getItem('anekal_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed reading auth from localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('anekal_token', newToken);
    localStorage.setItem('anekal_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('anekal_token');
    localStorage.removeItem('anekal_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const canEdit = user?.role === 'Admin' || user?.role === 'Data Manager';
  const canAdmin = user?.role === 'Admin';
  const isViewer = user?.role === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        canEdit,
        canAdmin,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
