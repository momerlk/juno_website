import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from "../api"



interface SellerAuthContextType {
  seller:  api.LoginResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, businessName: string) => Promise<void>;
  logout: () => void;
}

const SellerAuthContext = createContext<SellerAuthContextType | null>(null);

export const useSellerAuth = () => {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider');
  }
  return context;
};

export const SellerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [seller, setSeller] = useState<api.LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // TODO: Implement actual session check
        const storedSeller = localStorage.getItem('seller');
        if (storedSeller) {
          setSeller(JSON.parse(storedSeller));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const userAgent = navigator.userAgent;

      
      const loginInfo = {
        email : email,
        password : password,
        device_info : {
          app_version: "0.1.0",
          device_id: "",
          device_name: "",
          device_type: /Mobile|Android|iP(hone|od|ad)/.test(userAgent) ? 'mobile' : 'web',
          ip_address: "",
          last_used: new Date().toISOString(),
          os_version: userAgent.match(/Windows|Mac OS X|Linux|Android|iOS/)![0],
          user_agent: userAgent,
        }
      }
      console.log(loginInfo);

      const response = await api.sellerLogin(loginInfo);

      try {
        const seller = await api.getSellerProfile(response.token);
        console.log(response)
        response.user = seller;

      } catch (error) {
        alert("failed to get seller profile, error = " + error);
      }
      

      localStorage.setItem('seller', JSON.stringify(response));
      setSeller(response);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, businessName: string) => {

  };

  const logout = () => {
    localStorage.removeItem('seller');
    setSeller(null);
  };

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        isAuthenticated: !!seller,
        isLoading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};