import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginAmbassador } from '../api/chapterApi';

interface Ambassador {
  id: string;
  name: string;
  phone: string;
  institute: string;
  role: string;
  // Add other fields as needed based on the response
  [key: string]: any; 
}

interface AmbassadorAuthContextType {
  isAuthenticated: boolean;
  ambassador: Ambassador | null;
  isLoading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AmbassadorAuthContext = createContext<AmbassadorAuthContextType | undefined>(undefined);

export const AmbassadorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('ambassador_token');
      const storedAmbassador = localStorage.getItem('ambassador_data');

      if (token && storedAmbassador) {
        try {
          setAmbassador(JSON.parse(storedAmbassador));
          // Optionally verify token validity here or fetch fresh profile
        } catch (e) {
          console.error("Failed to parse stored ambassador data", e);
          localStorage.removeItem('ambassador_token');
          localStorage.removeItem('ambassador_data');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (phoneNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginAmbassador(phoneNumber);
      // Expected response: { token: string, ambassador: Ambassador }
      
      localStorage.setItem('ambassador_token', data.token);
      localStorage.setItem('ambassador_data', JSON.stringify(data.ambassador));
      
      setAmbassador(data.ambassador);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Login failed");
      throw err; // Re-throw so the component can handle it (e.g., show error message)
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ambassador_token');
    localStorage.removeItem('ambassador_data');
    setAmbassador(null);
  };

  return (
    <AmbassadorAuthContext.Provider value={{
      isAuthenticated: !!ambassador,
      ambassador,
      isLoading,
      login,
      logout,
      error
    }}>
      {children}
    </AmbassadorAuthContext.Provider>
  );
};

export const useAmbassadorAuth = () => {
  const context = useContext(AmbassadorAuthContext);
  if (!context) {
    throw new Error('useAmbassadorAuth must be used within an AmbassadorAuthProvider');
  }
  return context;
};
