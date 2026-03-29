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
    signup: (data: SellerApi.Auth.RegisterRequest) => Promise<void>;
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

    const persistSession = (session: SellerSession | null) => {
        if (!session) {
            localStorage.removeItem('seller');
            localStorage.removeItem('token');
            return;
        }

        localStorage.setItem('seller', JSON.stringify(session));
        localStorage.setItem('token', session.token);
    };

    useEffect(() => {
        const stored = localStorage.getItem('seller');
        if (!stored) {
            setIsLoading(false);
            return;
        }

        let parsed: SellerSession | null = null;
        try {
            parsed = JSON.parse(stored);
            setSeller(parsed);
            persistSession(parsed);
        }
        catch {
            persistSession(null);
            setIsLoading(false);
            return;
        }

        if (!parsed?.token) {
            persistSession(null);
            setSeller(null);
            setIsLoading(false);
            return;
        }

        const syncProfile = async () => {
            try {
                const resp = await SellerApi.Seller.GetProfile(parsed!.token);
                if (!resp.ok) throw new Error('Failed to fetch seller profile');

                const refreshedSession: SellerSession = {
                    token: parsed!.token,
                    user: resp.body,
                };

                setSeller(refreshedSession);
                persistSession(refreshedSession);
            } catch {
                setSeller(null);
                persistSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        syncProfile();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const resp = await SellerApi.Auth.Login(email, password);
            if (!resp.ok) throw new Error('Login failed');

            const payload = resp.body.data ?? resp.body;
            const profileResponse = await SellerApi.Seller.GetProfile(payload.token);
            const session: SellerSession = {
                token: payload.token,
                user: profileResponse.ok ? profileResponse.body : payload.seller ?? null,
            };

            persistSession(session);
            setSeller(session);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (data: SellerApi.Auth.RegisterRequest) => {
        setIsLoading(true);
        try {
            const resp = await SellerApi.Auth.Register(data);
            if (!resp.ok) throw new Error('Registration failed');

            const payload = resp.body.data ?? resp.body;
            const profileResponse = await SellerApi.Seller.GetProfile(payload.token);
            const session: SellerSession = {
                token: payload.token,
                user: profileResponse.ok ? profileResponse.body : payload.seller ?? null,
            };

            persistSession(session);
            setSeller(session);
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        persistSession(null);
        setSeller(null);
    };

    return (
        <SellerAuthContext.Provider value={{ seller, isAuthenticated: !!seller, isLoading, login, signup, logout }}>
            {children}
        </SellerAuthContext.Provider>
    );
};
