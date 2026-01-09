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

            addItem: (product, { customPrice = null, isPack = false, packs = 0 } = {}) => {
                const { items } = get();
                // Create a unique ID for the cart item based on product ID AND its customization
                // If we want to allow multiple rows for the same product with different prices, we need a unique cartItemId.
                // However, the prompt implies "Cart Item Row" has these *inputs*, meaning the user edits them *in the row*.
                // So `addItem` might just add the default, and then the row handles the editing?
                // OR `addItem` takes these parameters if added from a specific context?
                // Usually POS `addItem` just adds 1 unit. The requirements say "Cart Item Row: ... Unit Toggle ... Price Input".
                // This implies the state lives in the cart item.

                // Let's verify if we consolidate or separate. 
                // "User can overwrite this." -> Implies modifying the item in the cart.
                // So addItem usually just adds.

                const existingItem = items.find((i) => i.id === product.id);

                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === product.id ? {
                                ...i,
                                quantity: i.quantity + (isPack ? (packs * (product.items_per_pack || 1)) : 1)
                            } : i
                        ),
                    });
                } else {
                    set({
                        items: [
                            ...items,
                            {
                                ...product,
                                quantity: isPack ? (packs * (product.items_per_pack || 1)) : 1,
                                // Initialize defaults
                                customPrice: customPrice !== null ? customPrice : product.sell_price, // Will be used as the actual price
                                isPack: isPack,
                                packsInput: packs || 0 // Store the pack input value for UI consistency if needed
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

            updateQuantity: (productId, quantity) => {
                // This might need to be deprecated or wrapped by updateCartItem if we move to full object updates
                // But for compatibility with existing code:
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
                    const price = item.customPrice !== undefined ? item.customPrice : item.sell_price;
                    return total + (price * item.quantity);
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
                            price: item.customPrice !== undefined ? item.customPrice : item.sell_price,
                            sold_price: item.customPrice !== undefined ? item.customPrice : item.sell_price, // Backend expects sold_price?
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
