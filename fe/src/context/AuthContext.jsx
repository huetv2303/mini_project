import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/user');
            setUser(response.data);
        } catch (error) {
            localStorage.removeItem('access_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        const { access_token, user } = response.data;
        localStorage.setItem('access_token', access_token);
        setUser(user);
        return response.data;
    };

    const register = async (name, email, password) => {
        const response = await api.post('/register', { name, email, password });
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    const resendVerification = async (email) => {
        const response = await api.post('/email/resend', { email });
        return response.data;
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, resendVerification }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
