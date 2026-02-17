const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface ApiOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}

async function getCsrfCookie(): Promise<void> {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
    });
}

export async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...headers,
        },
        credentials: 'include',
    };

    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, config);

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        window.location.hash = '#/login';
        throw new Error('Unauthorized');
    }

    if (response.status === 403) {
        const data = await response.json();
        throw new Error(data.message || 'Forbidden');
    }

    if (response.status === 422) {
        const data = await response.json();
        throw new Error(JSON.stringify(data.errors || data.message));
    }

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export { getCsrfCookie, API_URL };
