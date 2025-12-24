"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, ShoppingCart, Trash2, Plus, Minus, CreditCard, RefreshCcw, User, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAuthStore } from "@/store/authStore"
import { useCartStore } from "@/store/cartStore"
import api from "@/utils/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"

export default function SalesPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const {
        items,
        addItem,
        removeItem,
        updateQuantity,
        selectedClient,
        setClient,
        getTotal,
        getTotalItems,
        checkout,
        isCheckingOut
    } = useCartStore()

    const queryClient = useQueryClient()

    const [search, setSearch] = useState("")
    const [paidAmount, setPaidAmount] = useState("")
    const [checkoutResult, setCheckoutResult] = useState(null) // { success: boolean, message: string }

    // Hydration Guard
    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
        );
    }

    // Fetch Products
    const { data: products = [], isLoading: isProductsLoading } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/api/inventory/products', { params: { skip: 0, limit: 100 } })
            return res.data
        }
    })

    // Fetch Clients
    const { data: clients = [] } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            try {
                const res = await api.get('/api/clients/clients')
                return res.data
            } catch (e) {
                console.warn("Clients fetch failed (API might be missing)", e)
                return []
            }
        }
    })

    // Filter Products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    // Handle Checkout
    const handleCheckout = async () => {
        const result = await checkout(paidAmount || getTotal());
        if (result.success) {
            setCheckoutResult({ success: true, message: "Продажа успешно оформлена!" });
            setPaidAmount("");
            queryClient.invalidateQueries(['products']);
        } else {
            setCheckoutResult({ success: false, message: result.error });
        }
    }

    return (
        <div className="flex h-[calc(100vh-1rem)] flex-col gap-4 lg:flex-row overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-2">

            {/* ================= LEFT PANEL: CATALOG (70%) ================= */}
            <div className="flex flex-[7] flex-col gap-4 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm relative">

                {/* Header & Search */}
                <div className="flex items-center justify-between p-6 pb-2 z-10">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Касса</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Выберите товары из каталога</p>
                    </div>
                </div>

                {/* Product Grid */}
                {/* Search is now inside the header area or separate? Ah, looks like I removed the search input from header in the snippet above? 
                   Wait, I should preserve the Search input in the Left Panel. 
                   The original code had Search input. I must keep it.
                   Let's target the Receipt Panel specifically for the Combobox change.
                */}


                {/* Product Grid */}
                <ScrollArea className="flex-1 p-6 pt-2">
                    {isProductsLoading ? (
                        <div className="flex h-full items-center justify-center text-zinc-500 animate-pulse">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin text-violet-500" />
                            Загрузка каталога...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex h-[400px] flex-col items-center justify-center text-zinc-400 opacity-50">
                            <RefreshCcw className="mb-4 h-12 w-12" />
                            <p className="text-lg font-medium">Товары не найдены</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 pb-20">
                            {filteredProducts.map(product => {
                                const isLowStock = product.quantity <= 5;
                                const isOutOfStock = product.quantity <= 0;
                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-violet-500/50 cursor-pointer ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                                            onClick={() => !isOutOfStock && addItem(product)}
                                        >
                                            <CardHeader className="p-4 pb-2 space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <Badge variant="secondary" className="bg-zinc-200/50 dark:bg-zinc-800/50 text-xs font-normal text-zinc-600 dark:text-zinc-400">
                                                        {product.unit}
                                                    </Badge>
                                                    <Badge className={isOutOfStock ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : isLowStock ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"}>
                                                        {product.quantity} шт
                                                    </Badge>
                                                </div>
                                                <CardTitle className="line-clamp-2 text-sm font-medium leading-normal h-10 text-zinc-700 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {product.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardFooter className="p-4 pt-1 flex items-end justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Цена</span>
                                                    <span className="text-xl font-bold text-zinc-900 dark:text-white">{product.sell_price} <span className="text-sm font-normal text-zinc-500">c.</span></span>
                                                </div>
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white transition-colors">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
            </div>

            {/* ================= RIGHT PANEL: RECEIPT (30%) ================= */}
            <div className="flex flex-[3] flex-col rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden relative">

                {/* Receipt Header */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-bold">
                        <ShoppingCart className="h-3 w-3" />
                        Ваш чек
                    </div>

                    {/* Client Selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-500 ml-1">Клиент</label>
                        <Combobox
                            options={[
                                { value: "anonymous", label: "👤 Анонимный покупатель" },
                                ...clients.map(c => ({
                                    value: c.id.toString(),
                                    label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`
                                }))
                            ]}
                            value={selectedClient ? selectedClient.id.toString() : "anonymous"}
                            onChange={(val) => {
                                if (val === "anonymous" || !val) {
                                    setClient(null)
                                } else {
                                    const client = clients.find(c => c.id.toString() === val)
                                    setClient(client)
                                }
                            }}
                            placeholder="Выберите клиента..."
                            searchPlaceholder="Поиск клиента..."
                            emptyText="Клиент не найден."
                        />
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-hidden relative bg-zinc-50/30 dark:bg-zinc-900/20">
                    <ScrollArea className="h-full p-4">
                        <AnimatePresence initial={false}>
                            {items.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center p-8 text-center h-[300px]"
                                >
                                    <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
                                        <ShoppingCart className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">Корзина пуста</p>
                                    <p className="text-xs text-zinc-400 mt-1 max-w-[150px]">Добавьте товары из каталога чтобы начать</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            className="group flex flex-col gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 shadow-sm hover:border-violet-500/30 transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 pr-2">
                                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{item.name}</p>
                                                    <p className="text-xs text-zinc-400 mt-0.5">{item.sell_price} c. / {item.unit}</p>
                                                </div>
                                                <p className="font-bold text-sm text-zinc-900 dark:text-white">{(item.sell_price * item.quantity).toFixed(0)}</p>
                                            </div>

                                            <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                                            <div className="flex items-center justify-between">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-red-500" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-zinc-700" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val) && val > 0) {
                                                                updateQuantity(item.id, val);
                                                            }
                                                        }}
                                                        className="w-12 h-7 p-0 text-center text-xs font-bold bg-transparent border-0 focus-visible:ring-0 shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white dark:hover:bg-zinc-700" onClick={() => addItem(item)}>
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </ScrollArea>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
                </div>

                {/* Receipt Footer */}
                <div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-6 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                    <div className="space-y-1 mb-6">
                        <div className="flex justify-between text-sm text-zinc-500">
                            <span>Товаров</span>
                            <span>{getTotalItems()} шт.</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Итого к оплате</span>
                            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{getTotal().toFixed(0)} <span className="text-lg font-normal text-zinc-400">c.</span></span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Wallet className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                type="number"
                                placeholder="Получено от клиента..."
                                className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 font-medium"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            onClick={() => {
                                const total = getTotal();
                                const currentPaid = paidAmount ? Number(paidAmount) : total;

                                // Validation: Anonymous users cannot have debt
                                if (!selectedClient && currentPaid < total) {
                                    setCheckoutResult({
                                        success: false,
                                        message: "Анонимный покупатель должен оплатить полную стоимость заказа."
                                    });
                                    return;
                                }

                                if (items.length > 0) handleCheckout();
                            }}
                            disabled={isCheckingOut || items.length === 0}
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Оформление...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Оплатить
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Success/Error Dialog */}
            <Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={checkoutResult?.success ? "text-emerald-600" : "text-red-600"}>
                            {checkoutResult?.success ? "Успешно" : "Ошибка"}
                        </DialogTitle>
                        <DialogDescription>
                            {checkoutResult?.message}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                        <Button onClick={() => setCheckoutResult(null)} variant={checkoutResult?.success ? "default" : "secondary"}>
                            Закрыть
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}