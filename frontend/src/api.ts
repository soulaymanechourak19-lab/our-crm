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

export interface ApiResult<T> {
    data: T | null;
    error: string | null;
    ok: boolean;
    status: number;
}

export async function apiRequest<T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
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

    try {
        const response = await fetch(`${API_URL}/api${endpoint}`, config);
        const status = response.status;

        if (status === 401) {
            localStorage.removeItem('auth_token');
            window.location.hash = '#/login';
            return { data: null, error: 'Unauthorized', ok: false, status };
        }

        let data: any = null;
        if (status !== 204) {
            data = await response.json().catch(() => null);
        }

        if (response.ok) {
            return { data: data as T, error: null, ok: true, status };
        }

        // Handle errors without throwing
        let errorMsg = 'An unexpected error occurred';
        if (status === 422 && data) {
            errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : 'Validation failed');
        } else if (data && data.message) {
            errorMsg = data.message;
        } else {
            errorMsg = `Request failed with status ${status}`;
        }

        return { data: data as T, error: errorMsg, ok: false, status };
    } catch (err: any) {
        // Network errors or other fetch failures
        return { data: null, error: err.message || 'Network error', ok: false, status: 0 };
    }
}

export { getCsrfCookie, API_URL };
