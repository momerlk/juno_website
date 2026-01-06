import React, { createContext, useState, useContext, useEffect } from 'react';

const API_BASE_URL = 'https://junoapi-1095577467512.asia-south2.run.app/api/v1';

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
      const response = await fetch(`${API_BASE_URL}/auth/admin-login?password=${encodeURIComponent(password)}`);
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      if (!data.token) {
        throw new Error('Token not found in response');
      }
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
