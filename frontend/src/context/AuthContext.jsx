import { createContext, useContext, useState, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = safeStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = useCallback((authResponse) => {
        safeStorage.setItem('accessToken', authResponse.accessToken);
        safeStorage.setItem('refreshToken', authResponse.refreshToken);
        const userData = {
            userId: authResponse.userId,
            email: authResponse.email,
            displayName: authResponse.displayName,
            systemRole: authResponse.systemRole,
        };
        safeStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        safeStorage.removeItem('accessToken');
        safeStorage.removeItem('refreshToken');
        safeStorage.removeItem('user');
        safeStorage.removeItem('activeOrganizationId');
        setUser(null);
    }, []);

    const updateUser = useCallback((updates) => {
        setUser(prev => {
            const newUser = { ...prev, ...updates };
            safeStorage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user, isLoading: false }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
