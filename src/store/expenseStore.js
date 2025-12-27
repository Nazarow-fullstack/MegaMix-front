import { create } from 'zustand';
import api from '@/utils/axios';

export const useExpenseStore = create((set, get) => ({
    expenses: [],
    isLoading: false,
    error: null,

    fetchExpenses: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get('/api/expenses');
            set({ expenses: res.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch expenses", error);
            set({
                expenses: [],
                isLoading: false,
                error: "Failed to load expenses"
            });
        }
    },

    addExpense: async (data) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/api/expenses', data);
            // Re-fetch to update the list consistent with requirements
            await get().fetchExpenses();
            return true; // Indicate success
        } catch (error) {
            console.error("Failed to add expense", error);
            set({
                isLoading: false,
                error: "Failed to add expense"
            });
            return false; // Indicate failure
        }
    },

    deleteExpense: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/api/expenses/${id}`);
            // Re-fetch to update the list
            await get().fetchExpenses();
            return true;
        } catch (error) {
            console.error("Failed to delete expense", error);
            set({
                isLoading: false,
                error: "Failed to delete expense"
            });
            return false;
        }
    }
}));
