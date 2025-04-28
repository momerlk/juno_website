import React, { createContext, useContext, useState, useEffect } from 'react';

interface Seller {
  id: string;
  email: string;
  businessName: string;
  subscriptionStatus: 'active' | 'inactive' | 'pending';
}

interface SellerAuthContextType {
  seller: Seller | null;
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
  const [seller, setSeller] = useState<Seller | null>(null);
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
      // TODO: Implement actual login API call
      const mockSeller: Seller = {
        id: '1',
        email,
        businessName: 'Test Business',
        subscriptionStatus: 'active'
      };
      localStorage.setItem('seller', JSON.stringify(mockSeller));
      setSeller(mockSeller);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, businessName: string) => {
    try {
      setIsLoading(true);
      // TODO: Implement actual signup API call
      const mockSeller: Seller = {
        id: '1',
        email,
        businessName,
        subscriptionStatus: 'pending'
      };
      localStorage.setItem('seller', JSON.stringify(mockSeller));
      setSeller(mockSeller);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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