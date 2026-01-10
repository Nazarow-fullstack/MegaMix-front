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
                            i.id === product.id ? {
                                ...i,
                                quantity: i.quantity + 1 // Simply increment by 1 unit for now
                            } : i
                        ),
                    });
                } else {
                    set({
                        items: [
                            ...items,
                            {
                                ...product,
                                // Initialize defaults
                                quantity: 1,
                                sold_price: product.sell_price || 0, // ERROR FIX: Never undefined
                                isPack: false,
                                packsInput: 0
                            }
                        ]
                    });
                }
            },

            removeItem: (productId) => {
                set({
                    items: get().items.filter((i) => i.id !== productId),
                });
            },

            updateCartItem: (productId, updates) => {
                set({
                    items: get().items.map((i) =>
                        i.id === productId ? { ...i, ...updates } : i
                    ),
                });
            },

            // ACTION: Update Price
            updateItemPrice: (productId, newPrice) => {
                set({
                    items: get().items.map((i) =>
                        i.id === productId ? { ...i, sold_price: newPrice } : i
                    ),
                });
            },

            // ACTION: Toggle Pack
            togglePack: (productId) => {
                const item = get().items.find(i => i.id === productId);
                if (!item) return;

                const newIsPack = !item.isPack;
                const itemsPerPack = item.items_per_pack || 1;

                let newQuantity = item.quantity;
                let newPacksInput = item.packsInput;

                if (newIsPack) {
                    // Switch TO Pack
                    // Default to 1 pack if switching
                    newPacksInput = 1;
                    newQuantity = itemsPerPack;
                } else {
                    // Switch TO Unit
                    // Keep current total quantity
                    newPacksInput = 0;
                    // newQuantity remains same
                }

                set({
                    items: get().items.map((i) =>
                        i.id === productId ? {
                            ...i,
                            isPack: newIsPack,
                            packsInput: newPacksInput,
                            quantity: newQuantity
                        } : i
                    ),
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
                return get().items.reduce((total, item) => {
                    // Use sold_price
                    return total + ((item.sold_price || 0) * item.quantity);
                }, 0);
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            fetchCatalog: async ({ page = 1, limit = 20 } = {}) => {
                set({ isLoadingData: true });
                try {
                    const skip = (page - 1) * limit;
                    const [productsRes, clientsRes] = await Promise.all([
                        api.get('/api/inventory/products', { params: { skip, limit } }),
                        api.get('/api/clients/clients')
                    ]);

                    set({
                        products: productsRes.data,
                        clients: clientsRes.data,
                        isLoadingData: false
                    });
                } catch (error) {
                    console.error("Failed to fetch catalog:", error);
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
                            price: item.sold_price, // Use sold_price
                            sold_price: item.sold_price,
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
            partialize: (state) => ({ items: state.items, selectedClient: state.selectedClient }),
        }
    )
);
