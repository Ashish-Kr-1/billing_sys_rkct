// Base URL
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// Simple API helper using fetch
export const api = {
    get: async (endpoint) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return res;
    },
    post: async (endpoint, data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return res;
    },
    put: async (endpoint, data) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return res;
    },
    delete: async (endpoint) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        return res;
    }
};

// Response handler
export const handleApiResponse = async (promise) => {
    try {
        const res = await promise;
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
        }
        return await res.json();
    } catch (error) {
        throw error;
    }
};