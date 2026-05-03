import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

function readStoredToken() {
    try {
        return localStorage.getItem('token') || null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(readStoredToken);
    const [loading, setLoading] = useState(true);

    const toDisplayName = (email) => {
        const raw = String(email || '').trim().split('@')[0];
        if (!raw) return 'User';
        return raw
            .replace(/[._-]+/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const avatarStorageKey = (email) => `fitflow-avatar-${String(email || '').toLowerCase()}`;

    /** Display name survives logout — keyed by email (legacy `userName` is migrated once). */
    const displayNameStorageKey = (email) =>
        `fitflow-display-name-${String(email || '').toLowerCase()}`;

    const readSavedDisplayName = (email) => {
        if (!email) return null;
        try {
            const key = displayNameStorageKey(email);
            const keyed = localStorage.getItem(key);
            if (keyed) return keyed;
            const legacy = localStorage.getItem('userName');
            if (legacy) {
                localStorage.setItem(key, legacy);
                localStorage.removeItem('userName');
                return legacy;
            }
        } catch {
            /* ignore */
        }
        return null;
    };

    // Helper to format FastAPI errors nicely
    const formatError = (errorData, defaultMsg) => {
        if (!errorData || !errorData.detail) return defaultMsg;
        if (Array.isArray(errorData.detail)) {
            // It's a Pydantic validation error (like password too long)
            return errorData.detail[0].msg || defaultMsg;
        }
        // It's a standard HTTPException (like Email already registered)
        return errorData.detail;
    };

    useEffect(() => {
        try {
            if (token) {
                localStorage.setItem('token', token);
                const email = localStorage.getItem('userEmail') || '';
                const savedName = readSavedDisplayName(email);
                const savedAvatar = localStorage.getItem(avatarStorageKey(email));
                setUser({ email, name: savedName || toDisplayName(email), avatar: savedAvatar || '' });
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                // Do not remove fitflow-display-name-*, fitflow-profile-*, fitflow-avatar-* — they must survive logout.
                setUser(null);
            }
        } catch (e) {
            console.warn('Auth storage unavailable', e);
            setUser(token ? { email: '', name: 'User', avatar: '' } : null);
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(formatError(errorData, 'Login failed'));
            }
            
            const data = await response.json();
            localStorage.setItem('userEmail', data.email);
            setToken(data.token);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const register = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(formatError(errorData, 'Registration failed'));
            }
            
            const data = await response.json();
            localStorage.setItem('userEmail', data.email);
            setToken(data.token);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setToken(null);
    };

    const updateUserName = (name) => {
        const clean = String(name || '').trim();
        if (!clean || !user?.email) return false;
        try {
            localStorage.setItem(displayNameStorageKey(user.email), clean);
            localStorage.removeItem('userName');
        } catch {
            return false;
        }
        setUser(prev => (prev ? { ...prev, name: clean } : prev));
        return true;
    };

    const updateUserAvatar = (avatarDataUrl) => {
        const clean = String(avatarDataUrl || '').trim();
        if (!clean || !user?.email) return false;
        if (user?.avatar) return false; // DP can be set only once.
        localStorage.setItem(avatarStorageKey(user.email), clean);
        setUser(prev => prev ? { ...prev, avatar: clean } : prev);
        return true;
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        updateUserName,
        updateUserAvatar,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
