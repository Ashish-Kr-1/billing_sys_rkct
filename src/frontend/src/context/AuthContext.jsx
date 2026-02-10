import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { API_BASE } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Fetch current user on mount if token exists
    useEffect(() => {
        if (token) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                // Token invalid, logout
                logout();
            }
        } catch (error) {
            console.error('Auth error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }

            const data = await res.json();

            // Handle OTP flow
            if (data.otpRequired) {
                return data; // Return OTP data without setting session yet
            }

            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);

            return data;
        } catch (error) {
            throw error;
        }
    };

    const verifyOtp = async (userId, otp) => {
        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'OTP Verification failed');
            }

            const data = await res.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('token', data.token);

            return data;

        } catch (error) {
            throw error;
        }
    };

    const signup = async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Signup failed');
            }

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('selectedCompany');
        localStorage.removeItem('lastActivity');
    }, []);

    // Auto-logout on inactivity (30 mins) - Syncs across tabs
    useEffect(() => {
        if (!token) return;

        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
        const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

        // Update local activity timestamp
        const updateActivity = () => {
            localStorage.setItem('lastActivity', Date.now().toString());
        };

        // Check for inactivity
        const checkInactivity = () => {
            const lastActivity = localStorage.getItem('lastActivity');
            if (lastActivity) {
                const now = Date.now();
                if (now - parseInt(lastActivity, 10) > INACTIVITY_LIMIT) {
                    console.log('User inactive for 30mins, logging out...');
                    logout();
                }
            } else {
                // If no activity record, set it now
                updateActivity();
            }
        };

        // Throttled event handler to avoid excessive localStorage writes
        let throttleTimer;
        const handleUserActivity = () => {
            if (!throttleTimer) {
                updateActivity(); // Immediate update on first action
                throttleTimer = setTimeout(() => {
                    throttleTimer = null;
                }, 5000); // Limit updates to once per 5 seconds
            }
        };

        // Initialize
        updateActivity();

        // Attach listeners
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => window.addEventListener(event, handleUserActivity));

        // Start interval
        const intervalId = setInterval(checkInactivity, CHECK_INTERVAL);

        return () => {
            events.forEach(event => window.removeEventListener(event, handleUserActivity));
            clearInterval(intervalId);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [token, logout]);

    const value = {
        user,
        token,
        login,
        signup,
        verifyOtp,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
