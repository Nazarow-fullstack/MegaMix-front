import { create } from 'zustand';
import api from '@/utils/axios';

export const useProductStore = create((set) => ({
    products: [],
    isLoading: false,
    movements: [],
    salesHistory: [],
    isLoadingHistory: false,
    error: null,

    fetchProducts: async (page = 1, limit = 10, search = "") => {
        set({ isLoading: true, error: null });
        try {
            const skip = (page - 1) * limit;
            const res = await api.get('/api/inventory/products', {
                params: { skip, limit, search }
            });
            set({ products: res.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch products", error);
            set({ products: [], isLoading: false, error: "Failed to load products" });
        }
    },

    fetchProductMovements: async (productId) => {
        set({ isLoadingHistory: true, error: null });
        try {
            const res = await api.get(`/api/inventory/products/${productId}/movements`);
            set({ movements: res.data, isLoadingHistory: false });
        } catch (error) {
            console.error("Failed to fetch movements", error);
            set({ movements: [], isLoadingHistory: false, error: "Failed to load movements" });
        }
    },

    fetchProductSales: async (productId) => {
        set({ isLoadingHistory: true, error: null });
        try {
            const res = await api.get(`/api/sales/products/${productId}/history`);
            set({ salesHistory: res.data, isLoadingHistory: false });
        } catch (error) {
            console.error("Failed to fetch sales history", error);
            set({ salesHistory: [], isLoadingHistory: false, error: "Failed to load sales history" });
        }
    },

    updateProduct: async (id, data) => {
        try {
            await api.put(`/api/inventory/products/${id}`, data);
        } catch (error) {
            console.error("Failed to update product", error);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            await api.delete(`/api/inventory/products/${id}`);
        } catch (error) {
            console.error("Failed to delete product", error);
            throw error;
        }
    },

    clearHistory: () => set({ movements: [], salesHistory: [], error: null }),
}));
