import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/login', data);
    return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/register', data);
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post('/logout');
};

export const getProfile = async (): Promise<User> => {
    const response = await api.get('/profile');
    return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/profile', data);
    return response.data;
};
