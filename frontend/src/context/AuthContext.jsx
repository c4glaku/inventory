import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            setLoading(false);
        };
        window.addEventListener('inventory:unauthorized', handleUnauthorized);

        api.get('/auth/me')
            .then(({ data }) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));

        return () => window.removeEventListener('inventory:unauthorized', handleUnauthorized);
    }, []);

    const login = authenticatedUser => setUser(authenticatedUser);

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
