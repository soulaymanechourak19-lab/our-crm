import api from './api';

export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    category: string;
    in_stock?: boolean;
    stock_status?: 'high' | 'medium' | 'low';
    created_at: string;
    updated_at: string;
}

export interface ProductFormData {
    name: string;
    description?: string;
    price: number;
    stock: number;
    category: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ProductParams {
    page?: number;
    category?: string;
    search?: string;
}

export const getProducts = async (params?: ProductParams): Promise<PaginatedResponse<Product>> => {
    const response = await api.get('/products', { params });
    return response.data;
};

export const getProduct = async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (data: ProductFormData): Promise<Product> => {
    const response = await api.post('/products', data);
    return response.data;
};

export const updateProduct = async (id: number, data: Partial<ProductFormData>): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
};

export const updateStock = async (id: number, stock: number): Promise<Product> => {
    const response = await api.put(`/products/${id}/stock`, { stock });
    return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
};

export const getCategories = async (): Promise<string[]> => {
    const response = await api.get('/products/categories/list');
    return response.data;
};
