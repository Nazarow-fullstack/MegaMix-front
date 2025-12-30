import { create } from 'zustand';
import api from '@/utils/axios';

export const useClientStore = create((set) => ({
    clients: [],
    isLoading: false,
    history: [],
    isHistoryLoading: false,

    fetchClients: async ({ page = 1, limit = 100, search = "" } = {}) => {
        set({ isLoading: true });
        try {
            const skip = (page - 1) * limit;
            const params = { skip, limit };
            if (search) params.search = search;

            const res = await api.get('/api/clients/clients', { params });
            set({ clients: res.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch clients:", error);
            set({ clients: [], isLoading: false });
        }
    },


    fetchClientHistory: async (clientId) => {
        set({ isHistoryLoading: true, history: [] }); // Reset history on new fetch
        try {
            const res = await api.get(`/api/clients/clients/${clientId}/history`);
            set({ history: res.data, isHistoryLoading: false });
        } catch (error) {
            console.error("Failed to fetch client history:", error);
            set({ history: [], isHistoryLoading: false });
        }
    },

    updateClient: async (id, data) => {
        try {
            await api.put(`/api/clients/clients/${id}`, data);
        } catch (error) {
            console.error("Failed to update client", error);
            throw error;
        }
    },

    deleteClient: async (id) => {
        try {
            await api.delete(`/api/clients/clients/${id}`);
        } catch (error) {
            console.error("Failed to delete client", error);
            throw error;
        }
    },
}));
