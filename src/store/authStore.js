import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/utils/axios';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: Cookies.get('token') || null,
    isLoading: true, // Initial load state
    error: null,

    login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
            // Prepare form data for x-www-form-urlencoded
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/api/auth/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token } = response.data;

            // Save token
            Cookies.set('token', access_token, { expires: 7 }); // 7 days
            localStorage.setItem('token', access_token);

            set({ token: access_token });

            // Fetch user info
            await get().fetchUser();

            set({ isLoading: false });
            return true; // Success
        } catch (error) {
            console.error("Login error:", error);
            set({
                error: error.response?.data?.detail || 'Login failed. Please check your credentials.',
                isLoading: false,
            });
            return false; // Failure
        }
    },

    logout: () => {
        Cookies.remove('token');
        localStorage.removeItem('token');
        set({ user: null, token: null, error: null });
        // Optional: Redirect is usually handled by the component consuming this state or specific logic
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    },

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            if (!get().token) {
                set({ isLoading: false });
                return;
            }
            const response = await api.get('/api/auth/me');
            set({ user: response.data, isLoading: false });
        } catch (error) {
            console.error("Fetch user error:", error);
            // If fetching user fails (e.g. invalid token), logout might be triggered by axios interceptor,
            // but we ensure state is clean here too if it wasn't a 401
            if (error.response?.status !== 401) {
                set({ error: 'Failed to fetch user data', isLoading: false });
            }
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        const token = Cookies.get('token') || localStorage.getItem('token');
        if (token) {
            set({ token });
            await get().fetchUser();
        } else {
            set({ token: null, user: null, isLoading: false });
        }
    }
}));
