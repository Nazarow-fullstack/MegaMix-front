import { create } from 'zustand';
import api from '@/utils/axios';

export const useUserStore = create((set, get) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get('/api/auth/users');
            set({ users: res.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch users", error);
            set({
                users: [],
                isLoading: false,
                error: "Failed to load users"
            });
        }
    },

    createUser: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/api/auth/users', userData);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error("Failed to create user", error);
            set({
                isLoading: false,
                error: error.response?.data?.detail || "Failed to create user"
            });
            return false;
        }
    },

    updateUser: async (id, userData) => {
        set({ isLoading: true, error: null });
        try {
            await api.put(`/api/auth/users/${id}`, userData);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error("Failed to update user", error);
            set({
                isLoading: false,
                error: error.response?.data?.detail || "Failed to update user"
            });
            return false;
        }
    },

    deleteUser: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/api/auth/users/${id}`);
            await get().fetchUsers();
            return true;
        } catch (error) {
            console.error("Failed to delete user", error);
            set({
                isLoading: false,
                error: error.response?.data?.detail || "Failed to delete user"
            });
            return false;
        }
    }
}));
