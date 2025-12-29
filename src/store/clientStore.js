import { create } from 'zustand';
import api from '@/utils/axios';

export const useClientStore = create((set) => ({
    history: [],
    isHistoryLoading: false,

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
