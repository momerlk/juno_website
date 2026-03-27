import React, { createContext, useState, useContext, useEffect } from 'react';
import { request } from '../api/core';

interface Admin {
  name: "Admin";
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) {
      setToken(storedToken);
      setAdmin({ name: 'Admin' });
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      const resp = await request(`/auth/admin-login?password=${encodeURIComponent(password)}`, 'GET', undefined, undefined, true);
      if (!resp.ok) throw new Error('Login failed');
      const data = resp.body as any;
      if (!data.token) throw new Error('Token not found in response');
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
      setAdmin({ name: 'Admin' });
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated: !!token, admin, token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
