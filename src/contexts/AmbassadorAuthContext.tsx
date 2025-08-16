import React, { createContext, useState, useContext, useEffect } from 'react';

const API_BASE_URL = 'https://junoapi-710509977105.asia-south2.run.app/api/v1';

interface InviteData {
  owner: string;
  code: string;
  signups: number;
}

interface Ambassador {
  email: string;
}

interface AmbassadorAuthContextType {
  isAuthenticated: boolean;
  ambassador: Ambassador | null;
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  fetchInviteData: () => Promise<Array<InviteData> | null>;
  generateInviteCode: () => Promise<InviteData | null>;
}

const AmbassadorAuthContext = createContext<AmbassadorAuthContextType | undefined>(undefined);

export const AmbassadorAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem('ambassador_email');
    if (storedEmail) {
      setAmbassador({ email: storedEmail });
    }
    setIsLoading(false);
  }, []);

  const login = (email: string) => {
    localStorage.setItem('ambassador_email', email);
    setAmbassador({ email });
  };

  const logout = () => {
    localStorage.removeItem('ambassador_email');
    setAmbassador(null);
  };

  const fetchInviteData = async (): Promise<Array<InviteData> | null> => {
    if (!ambassador) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/invites/by-owner?owner=${encodeURIComponent(ambassador.email)}`);
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 404) {
        return null; // No code exists yet
      }
      throw new Error('Failed to fetch invite data');
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const generateInviteCode = async (): Promise<InviteData | null> => {
    if (!ambassador) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/invites/generate?owner=${encodeURIComponent(ambassador.email)}`, {
        method: 'POST',
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to generate invite code');
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return (
    <AmbassadorAuthContext.Provider value={{
      isAuthenticated: !!ambassador,
      ambassador,
      isLoading,
      login,
      logout,
      fetchInviteData,
      generateInviteCode
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