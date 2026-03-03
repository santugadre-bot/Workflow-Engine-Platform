import axios from 'axios';
import { safeStorage } from '../utils/safeStorage';

const client = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
client.interceptors.request.use((config) => {
    const token = safeStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor — auto-refresh on 401
client.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = safeStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                    safeStorage.setItem('accessToken', data.accessToken);
                    safeStorage.setItem('refreshToken', data.refreshToken);
                    original.headers.Authorization = `Bearer ${data.accessToken}`;
                    return client(original);
                } catch {
                    // Only clear auth tokens — preserve user preferences (theme, favorites, recents)
                    ['accessToken', 'refreshToken', 'user'].forEach(k => safeStorage.removeItem(k));
                    window.location.href = '/login';
                }
            } else {
                // No refresh token — only clear auth tokens
                ['accessToken', 'refreshToken', 'user'].forEach(k => safeStorage.removeItem(k));
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default client;
