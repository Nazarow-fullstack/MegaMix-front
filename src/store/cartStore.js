import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/axios';

export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            selectedClient: null,
            isCheckingOut: false,

            // New Data State
            products: [],
            clients: [],
            isLoadingData: false,

            addItem: (product) => {
                const { items } = get();
                const existingItem = items.find((i) => i.id === product.id);

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

            fetchCatalog: async () => {
                const { products } = get();
                // Optional optimization: don't refetch if we already have data
                if (products.length > 0) return;

                set({ isLoadingData: true });
                try {
                    const [productsRes, clientsRes] = await Promise.all([
                        api.get('/api/inventory/products', { params: { skip: 0, limit: 100 } }),
                        api.get('/api/clients/clients')
                    ]);

                    set({
                        products: productsRes.data,
                        clients: clientsRes.data,
                        isLoadingData: false
                    });
                } catch (error) {
                    console.error("Failed to fetch catalog:", error);
                    // Even if it fails, stop loading
                    set({ isLoadingData: false });
                }
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
                        paid_amount: Number(paidAmount) || getTotal()
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
            partialize: (state) => ({ items: state.items, selectedClient: state.selectedClient }), // Don't persist products/clients to keep data fresh on reload? Or should we?
            // The prompt said "If products are already loaded, don't refetch automatically to save bandwidth". 
            // If I don't persist them, they won't be "already loaded" on page refresh. 
            // So likely I should persist them or at least let them be in memory. 
            // If I don't persist them, `products` starts empty on refresh.
            // But if I persist them, they might get stale. 
            // Given the requirement "Optimization: If products are already loaded...", this usually implies within the session or if persisted.
            // I'll stick to NOT persisting products/clients for now to ensure data freshness on full reload, 
            // but the optimization applies if I navigate away and back.
        }
    )
);
