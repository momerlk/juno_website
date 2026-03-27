import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SellerApi from '../api/sellerApi';

interface SellerSession {
    token: string;
    user: any;
}

interface SellerAuthContextType {
    seller: SellerSession | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, businessName: string) => Promise<void>;
    logout: () => void;
}

const SellerAuthContext = createContext<SellerAuthContextType | null>(null);

export const useSellerAuth = () => {
    const context = useContext(SellerAuthContext);
    if (!context) throw new Error('useSellerAuth must be used within a SellerAuthProvider');
    return context;
};

export const SellerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [seller, setSeller] = useState<SellerSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('seller');
        if (stored) {
            try { setSeller(JSON.parse(stored)); }
            catch { localStorage.removeItem('seller'); }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const loginResp = await SellerApi.Auth.Login(email, password);
            if (!loginResp.ok) throw new Error('Login failed');

            const session: SellerSession = { token: loginResp.body.token, user: null };

            const profileResp = await SellerApi.Auth.GetProfile(session.token);
            if (profileResp.ok) {
                session.user = profileResp.body;
            } else {
                alert('Failed to get seller profile');
            }

            localStorage.setItem('seller', JSON.stringify(session));
            setSeller(session);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (_email: string, _password: string, _businessName: string) => {
        // TODO: implement
    };

    const logout = () => {
        localStorage.removeItem('seller');
        setSeller(null);
    };

    return (
        <SellerAuthContext.Provider value={{ seller, isAuthenticated: !!seller, isLoading, login, signup, logout }}>
            {children}
        </SellerAuthContext.Provider>
    );
};
