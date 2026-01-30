import React, { createContext, useState, useContext, useEffect } from 'react';

const API_BASE_URL = 'https://junoapi-1095577467512.asia-south2.run.app/api/v1';

interface Ambassador {
  phoneNumber: string;
}

interface AmbassadorAuthContextType {
  isAuthenticated: boolean;
  ambassador: Ambassador | null;
  isLoading: boolean;
  login: (phoneNumber: string) => void;
  logout: () => void;
}

const AmbassadorAuthContext = createContext<AmbassadorAuthContextType | undefined>(undefined);

export const AmbassadorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedPhone = localStorage.getItem('ambassador_phone');
    if (storedPhone) {
      setAmbassador({ phoneNumber: storedPhone });
    }
    setIsLoading(false);
  }, []);

  const login = (phoneNumber: string) => {
    localStorage.setItem('ambassador_phone', phoneNumber);
    setAmbassador({ phoneNumber });
  };

  const logout = () => {
    localStorage.removeItem('ambassador_phone');
    setAmbassador(null);
  };

  return (
    <AmbassadorAuthContext.Provider value={{
      isAuthenticated: !!ambassador,
      ambassador,
      isLoading,
      login,
      logout,
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