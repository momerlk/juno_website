import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the shape of the admin user and the context
interface Admin {
  id: string;
  name: "Admin";
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('admin_token');
        if (storedToken) {
          setAdmin({ id: 'admin', name: 'Admin' });
        }
      } catch (error) {
        setAdmin(null);
        localStorage.removeItem('admin_token');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://junoapi-710509977105.asia-south2.run.app/api/v1/auth/admin-login?password=${password}`);

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error('Token not found in response');
      }

      localStorage.setItem('admin_token', token);
      setAdmin({ id: 'admin', name: 'Admin' });
    } catch (error) {
      console.error('Admin login failed:', error);
      localStorage.removeItem('admin_token');
      setAdmin(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_token');
  };

  const isAuthenticated = !!admin;

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, admin, isLoading, login, logout }}>
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
