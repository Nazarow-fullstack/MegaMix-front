import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Create axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (specifically 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            const logout = useAuthStore.getState().logout;
            logout();
        }
        return Promise.reject(error);
    }
);

export default api;
