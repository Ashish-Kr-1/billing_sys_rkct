/**
 * API Utility for Multi-Company Billing System
 * Automatically injects x-company-id header based on selected company
 */

import { API_BASE } from './api.js';

/**
 * Get the currently selected company from localStorage
 * @returns {Object|null} Selected company object
 */
export function getSelectedCompany() {
    try {
        const saved = localStorage.getItem('selectedCompany');
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error('Error reading selected company:', error);
        return null;
    }
}

/**
 * Enhanced fetch that automatically adds company context
 * @param {string} endpoint - API endpoint (e.g., '/parties')
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
    const company = getSelectedCompany();

    // Build headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add company ID header if available
    if (company && company.id) {
        headers['x-company-id'] = company.id.toString();
    }

    // Build full URL
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    // Make request
    const response = await fetch(url, {
        ...options,
        headers,
    });

    return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    /**
     * GET request
     */
    get: async (endpoint, options = {}) => {
        return apiFetch(endpoint, { ...options, method: 'GET' });
    },

    /**
     * POST request
     */
    post: async (endpoint, data, options = {}) => {
        return apiFetch(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * PUT request
     */
    put: async (endpoint, data, options = {}) => {
        return apiFetch(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * DELETE request
     */
    delete: async (endpoint, options = {}) => {
        return apiFetch(endpoint, { ...options, method: 'DELETE' });
    },
};

/**
 * Helper to handle API responses with error handling
 * @param {Promise<Response>} responsePromise 
 * @returns {Promise<any>} Parsed JSON data
 */
export async function handleApiResponse(responsePromise) {
    try {
        const response = await responsePromise;

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Example usage:
 * 
 * // Simple GET
 * const parties = await handleApiResponse(api.get('/parties'));
 * 
 * // POST with data
 * const result = await handleApiResponse(
 *   api.post('/createParty', { party_name: 'Test', type: 'customer' })
 * );
 * 
 * // With custom headers
 * const data = await handleApiResponse(
 *   api.get('/parties', { headers: { 'Authorization': 'Bearer token' } })
 * );
 */
