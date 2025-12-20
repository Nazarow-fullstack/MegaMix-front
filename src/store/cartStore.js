import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/axios';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            selectedClient: null,
            isCheckingOut: false,

            addItem: (product) => {
                const { items } = get();
                const existingItem = items.find((i) => i.id === product.id);

                // Check if adding exceeds stock (optional, but good UX)
                // For now, we allow adding but maybe show handling in UI
                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    });
                } else {
                    set({ items: [...items, { ...product, quantity: 1 }] });
                }
            },

            removeItem: (productId) => {
                set({
                    items: get().items.filter((i) => i.id !== productId),
                });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity < 1) return;
                set({
                    items: get().items.map((i) =>
                        i.id === productId ? { ...i, quantity } : i
                    ),
                });
            },

            setClient: (client) => {
                set({ selectedClient: client });
            },

            clearCart: () => set({ items: [], selectedClient: null }),

            getTotal: () => {
                return get().items.reduce((total, item) => total + item.sell_price * item.quantity, 0);
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            checkout: async (paidAmount) => {
                const { items, selectedClient, getTotal } = get();

                if (items.length === 0) {
                    return { success: false, error: "Корзина пуста" };
                }

                set({ isCheckingOut: true });

                try {
                    const payload = {
                        items: items.map(item => ({
                            product_id: item.id,
                            quantity: item.quantity,
                            price: item.sell_price
                        })),
                        client_id: selectedClient ? selectedClient.id : null,
                        paid_amount: Number(paidAmount) || getTotal() // Default to exact amount if not provided
                    };

                    await api.post('/api/sales/sales', payload);

                    get().clearCart();
                    set({ isCheckingOut: false });
                    return { success: true };
                } catch (error) {
                    console.error("Checkout error:", error);
                    set({ isCheckingOut: false });
                    return { success: false, error: error.response?.data?.detail || "Ошибка при оформлении продажи" };
                }
            }
        }),
        {
            name: 'pos-cart-storage',
            // storage is localStorage by default
            partialize: (state) => ({ items: state.items, selectedClient: state.selectedClient }), // Only persist items and client
        }
    )
);
