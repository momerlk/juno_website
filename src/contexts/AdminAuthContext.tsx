import React, { createContext, useState, useContext, useEffect } from 'react';
import { Auth } from '../api/adminApi';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedRefreshToken = localStorage.getItem('admin_refresh_token');
    const storedAdmin = localStorage.getItem('admin_user');

    const restore = async () => {
      if (storedToken) {
        setToken(storedToken);
        if (storedAdmin) {
          try {
            setAdmin(JSON.parse(storedAdmin));
          } catch {
            setAdmin({ id: '', email: '', name: 'Admin', role: 'admin' });
          }
        } else {
          setAdmin({ id: '', email: '', name: 'Admin', role: 'admin' });
        }
        setIsLoading(false);
        return;
      }

      if (storedRefreshToken) {
        try {
          const refreshed = await Auth.Refresh(storedRefreshToken);
          if (!refreshed.ok) throw new Error('Refresh failed');

          const payload = refreshed.body as Auth.LoginResponse;
          const accessToken = payload.access_token ?? payload.token;
          if (!accessToken) throw new Error('Access token not found in refresh response');

          localStorage.setItem('admin_token', accessToken);
          if (payload.refresh_token) {
            localStorage.setItem('admin_refresh_token', payload.refresh_token);
          }
          if (payload.admin) {
            localStorage.setItem('admin_user', JSON.stringify(payload.admin));
            setAdmin(payload.admin);
          }
          setToken(accessToken);
          setIsLoading(false);
          return;
        } catch {
          Auth.Logout();
          localStorage.removeItem('admin_user');
        }
      }

      setIsLoading(false);
    };

    void restore();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await Auth.Login(email, password);
      if (!resp.ok) throw new Error('Login failed');
      
      const data = resp.body as Auth.LoginResponse;
      const accessToken = data.access_token ?? data.token;
      if (!accessToken) throw new Error('Token not found in response');
      
      localStorage.setItem('admin_token', accessToken);
      if (data.refresh_token) {
        localStorage.setItem('admin_refresh_token', data.refresh_token);
      }
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      setToken(accessToken);
      setAdmin(data.admin);
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Auth.Logout();
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('admin_user');
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
