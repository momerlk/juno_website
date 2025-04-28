import React, { createContext, useContext, useState } from 'react';
import { generateQRCode } from '../utils/qrCode';

interface JunoStudioAccount {
  id: string;
  username: string;
  password: string;
  qrCode: string;
  createdAt: string;
}

interface JunoStudioContextType {
  accounts: JunoStudioAccount[];
  createAccount: () => Promise<JunoStudioAccount>;
  deleteAccount: (id: string) => void;
}

const JunoStudioContext = createContext<JunoStudioContextType | null>(null);

export const useJunoStudio = () => {
  const context = useContext(JunoStudioContext);
  if (!context) {
    throw new Error('useJunoStudio must be used within a JunoStudioProvider');
  }
  return context;
};

export const JunoStudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<JunoStudioAccount[]>([]);

  const generateUsername = () => {
    const prefix = 'juno';
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${randomString}`;
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const createAccount = async () => {
    const username = generateUsername();
    const password = generatePassword();
    const credentials = { username, password };
    
    // Generate QR code containing the credentials
    const qrCode = await generateQRCode(JSON.stringify(credentials));
    
    const newAccount: JunoStudioAccount = {
      id: Math.random().toString(36).substring(2),
      username,
      password,
      qrCode,
      createdAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  return (
    <JunoStudioContext.Provider
      value={{
        accounts,
        createAccount,
        deleteAccount
      }}
    >
      {children}
    </JunoStudioContext.Provider>
  );
};