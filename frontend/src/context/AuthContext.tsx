import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────
export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'agent_commercial' | 'agent_sav';
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Record<string, string>) => Promise<void>;
}

// ── Context ────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};

// ── Provider ───────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUser = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get('/user');
            setUser(data);
        } catch {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // ── Login (pure Bearer token — no CSRF needed) ──
    const login = async (email: string, password: string) => {
        const { data } = await api.post('/login', { email, password });
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };

    // ── Register ──
    const register = async (
        name: string,
        email: string,
        password: string,
        password_confirmation: string
    ) => {
        const { data } = await api.post('/register', {
            name,
            email,
            password,
            password_confirmation,
        });
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    };

    // ── Logout ──
    const logout = async () => {
        try {
            await api.post('/logout');
        } catch {
            // token might already be invalid — proceed anyway
        }
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    // ── Update profile ──
    const updateProfile = async (profileData: Record<string, string>) => {
        const { data } = await api.put('/profile', profileData);
        setUser(data.user);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
