import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SellerApi from '../api/sellerApi';

interface SellerSession {
    token: string;
    refreshToken?: string;
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
            localStorage.removeItem('seller_token');
            localStorage.removeItem('seller_refresh_token');
            return;
        }

        localStorage.setItem('seller', JSON.stringify(session));
        localStorage.setItem('token', session.token);
        localStorage.setItem('seller_token', session.token);
        if (session.refreshToken) {
            localStorage.setItem('seller_refresh_token', session.refreshToken);
        } else {
            localStorage.removeItem('seller_refresh_token');
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('seller');
        const storedToken = localStorage.getItem('seller_token') ?? localStorage.getItem('token');
        const storedRefreshToken = localStorage.getItem('seller_refresh_token');

        const restore = async () => {
            if (stored) {
                let parsed: SellerSession | null = null;
                try {
                    parsed = JSON.parse(stored);
                    if (parsed?.token) {
                        setSeller(parsed);
                        persistSession(parsed);
                    }
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
                            refreshToken: parsed!.refreshToken,
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

                await syncProfile();
                return;
            }

            if (storedToken) {
                const session: SellerSession = {
                    token: storedToken,
                    refreshToken: storedRefreshToken ?? undefined,
                    user: null,
                };

                setSeller(session);
                persistSession(session);

                try {
                    const resp = await SellerApi.Seller.GetProfile(storedToken);
                    if (!resp.ok) throw new Error('Failed to fetch seller profile');

                    const refreshedSession: SellerSession = {
                        token: storedToken,
                        refreshToken: storedRefreshToken ?? undefined,
                        user: resp.body,
                    };

                    setSeller(refreshedSession);
                    persistSession(refreshedSession);
                } catch {
                    if (!storedRefreshToken) {
                        persistSession(null);
                        setSeller(null);
                    }
                } finally {
                    setIsLoading(false);
                }
                return;
            }

            if (storedRefreshToken) {
                try {
                    const refreshResponse = await SellerApi.Auth.Refresh(storedRefreshToken);
                    if (!refreshResponse.ok) throw new Error('Failed to refresh seller session');

                    const payload = refreshResponse.body as SellerApi.Auth.RefreshResponse;
                    const accessToken = payload.access_token ?? payload.token;
                    if (!accessToken) throw new Error('Access token not found in refresh response');

                    const session: SellerSession = {
                        token: accessToken,
                        refreshToken: payload.refresh_token ?? storedRefreshToken,
                        user: payload.seller ?? null,
                    };

                    persistSession(session);
                    setSeller(session);
                } catch {
                    persistSession(null);
                    setSeller(null);
                } finally {
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(false);
        };

        void restore();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const resp = await SellerApi.Auth.Login(email, password);
            if (!resp.ok) throw new Error('Login failed');

            const payload = resp.body;
            const accessToken = payload.access_token ?? payload.token;
            if (!accessToken) throw new Error('Access token not found in response');

            const profileResponse = await SellerApi.Seller.GetProfile(accessToken);
            const session: SellerSession = {
                token: accessToken,
                refreshToken: payload.refresh_token,
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

            const payload = resp.body;
            const accessToken = payload.access_token ?? payload.token;
            if (!accessToken) throw new Error('Access token not found in response');

            const profileResponse = await SellerApi.Seller.GetProfile(accessToken);
            const session: SellerSession = {
                token: accessToken,
                refreshToken: payload.refresh_token,
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
