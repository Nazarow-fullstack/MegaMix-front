"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, ShoppingCart, Trash2, Plus, Minus, CreditCard, RefreshCcw, User, Wallet, Grid } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAuthStore } from "@/store/authStore"
import { useCartStore } from "@/store/cartStore"

import { Button } from "@/components/ui/button"
import PaginationControls from "@/components/ui/PaginationControls"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
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
        isCheckingOut,
        products,
        clients,
        isLoadingData,
        fetchCatalog
    } = useCartStore()

    const [mobileTab, setMobileTab] = useState("catalog") // 'catalog' | 'cart'
    const [search, setSearch] = useState("")
    const [paidAmount, setPaidAmount] = useState("")
    const [checkoutResult, setCheckoutResult] = useState(null)

    // Pagination
    const [page, setPage] = useState(1)
    const limit = 20

    useEffect(() => {
        fetchCatalog({ page, limit })
    }, [page, fetchCatalog])

    // Hydration Guard
    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
        );
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleCheckout = async () => {
        const result = await checkout(paidAmount || getTotal());
        if (result.success) {
            setCheckoutResult({ success: true, message: "Продажа успешно оформлена!" });
            setPaidAmount("");
        } else {
            setCheckoutResult({ success: false, message: result.error });
        }
    }

    const totalMoney = getTotal();
    const totalItemsCount = getTotalItems();

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)] lg:flex-row gap-4 overflow-hidden bg-zinc-50 dark:bg-zinc-950 p-2 lg:p-4">

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden flex w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 shrink-0 mb-2">
                <button
                    onClick={() => setMobileTab("catalog")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center ${mobileTab === "catalog"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                >
                    <Grid className="w-4 h-4 mr-2" />
                    Товары
                </button>
                <button
                    onClick={() => setMobileTab("cart")}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center ${mobileTab === "cart"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Корзина ({totalItemsCount})
                </button>
            </div>

            {/* CATALOG PANEL */}
            <div className={`
                flex-[7] flex-col gap-4 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm relative transition-all
                ${mobileTab === 'catalog' ? 'flex h-full' : 'hidden'} 
                lg:flex
            `}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 pb-2 sm:pb-4 z-10 gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">Касса</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Каталог товаров</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Поиск товара..."
                            className="pl-9 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Products Grid */}
                <ScrollArea className="flex-1 p-3 sm:p-6 pt-2">
                    {isLoadingData ? (
                        <div className="flex h-64 items-center justify-center text-zinc-500 animate-pulse">
                            <Loader2 className="mr-2 h-6 w-6 animate-spin text-violet-500" />
                            Загрузка каталога...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center text-zinc-400 opacity-50">
                            <RefreshCcw className="mb-4 h-12 w-12" />
                            <p className="text-lg font-medium">Товары не найдены</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pb-20 lg:pb-0">
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.quantity <= 0;
                                const isLowStock = product.quantity <= 5;
                                return (
                                    <div
                                        key={product.id}
                                        className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 transition-all active:scale-95 cursor-pointer flex flex-col
                                            ${isOutOfStock ? 'opacity-60 grayscale border-zinc-200' : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 hover:shadow-lg'}
                                        `}
                                        onClick={() => !isOutOfStock && addItem(product)}
                                    >
                                        <div className="p-3 sm:p-4 space-y-2 flex-grow">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="secondary" className="bg-white/50 dark:bg-zinc-800/50 text-[10px] sm:text-xs px-1.5 py-0">
                                                    {product.unit}
                                                </Badge>
                                                <Badge className={`text-[10px] sm:text-xs px-1.5 py-0 ${isOutOfStock ? "bg-red-100 text-red-600" : isLowStock ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                                                    {product.quantity}
                                                </Badge>
                                            </div>
                                            <h3 className="line-clamp-2 text-xs sm:text-sm font-medium h-8 sm:h-10 text-zinc-700 dark:text-zinc-200 leading-snug">
                                                {product.name}
                                            </h3>
                                        </div>
                                        <div className="p-3 sm:p-4 pt-0 flex items-end justify-between bg-white/50 dark:bg-zinc-900/50">
                                            <div>
                                                <div className="text-sm sm:text-lg font-bold text-zinc-900 dark:text-white">
                                                    {product.sell_price} <span className="text-[10px] sm:text-xs font-normal text-zinc-500">c.</span>
                                                </div>
                                            </div>
                                            <Button size="icon" className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white shadow-none">
                                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}


                    <div className="pb-20 lg:pb-10">
                        <PaginationControls
                            page={page}
                            setPage={setPage}
                            hasMore={products.length === limit}
                            isLoading={isLoadingData}
                        />
                    </div>
                </ScrollArea>

                {/* Mobile Floating Footer - Only visible on Mobile when items > 0 */}
                <div className={`lg:hidden absolute bottom-4 left-4 right-4 z-20 transition-transform duration-300 ${totalItemsCount > 0 ? 'translate-y-0' : 'translate-y-[200%]'}`}>
                    <Button
                        onClick={() => setMobileTab("cart")}
                        className="w-full h-14 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl flex justify-between items-center px-6 active:scale-95 transition-transform"
                    >
                        <span className="flex items-center">
                            <span className="bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded text-xs mr-3 font-mono">{totalItemsCount}</span>
                            <span>Перейти к оплате</span>
                        </span>
                        <span className="font-bold text-lg">{totalMoney.toFixed(0)} c.</span>
                    </Button>
                </div>

                {/* Desktop Gradient Fade */}
                <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none" />
            </div >

            {/* RECEIPT PANEL */}
            < div className={`
                flex-[3] flex-col rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden
                ${mobileTab === 'cart' ? 'flex h-full' : 'hidden'}
                lg:flex
            `}>
                {/* Header */}
                < div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 space-y-3" >
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-widest font-bold">
                        <Wallet className="h-3 w-3" />
                        Ваш чек
                    </div>
                    {/* Client Selector */}
                    <div className="space-y-1">
                        <Combobox
                            options={[
                                { value: "anonymous", label: "👤 Анонимный покупатель" },
                                ...clients.map(c => ({
                                    value: c.id.toString(),
                                    label: `${c.full_name} ${c.phone ? `(${c.phone})` : ''}`
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
                            searchPlaceholder="Поиск..."
                            emptyText="Клиент не найден."
                        />
                    </div>
                </div >

                {/* List */}
                < div className="flex-1 overflow-hidden relative bg-zinc-50/30 dark:bg-zinc-900/20" >
                    <ScrollArea className="h-full p-4">
                        <AnimatePresence mode="popLayout">
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
                                </motion.div>
                            ) : (
                                <div className="space-y-3 pb-20 lg:pb-0">
                                    {items.map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
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
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeItem(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md bg-white dark:bg-zinc-700 shadow-sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === "") return; // Allow empty while typing
                                                            const num = parseInt(val);
                                                            if (!isNaN(num) && num > 0) {
                                                                updateQuantity(item.id, num);
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Reset to 1 if user leaves it empty or 0
                                                            if (!e.target.value || parseInt(e.target.value) <= 0) {
                                                                updateQuantity(item.id, 1);
                                                            }
                                                        }}
                                                        className="w-12 h-7 p-0 text-center text-sm font-bold bg-transparent border-0 focus-visible:ring-0 shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md bg-white dark:bg-zinc-700 shadow-sm" onClick={() => addItem(item)}>
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
                </div >

                {/* Footer */}
                < div className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-6 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]" >
                    <div className="space-y-1 mb-6">
                        <div className="flex justify-between items-baseline">
                            <span className="text-base font-semibold text-zinc-700 dark:text-zinc-300">Итого</span>
                            <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{totalMoney.toFixed(0)} <span className="text-lg font-normal text-zinc-400">c.</span></span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <Wallet className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                type="number"
                                placeholder="Получено от клиента..."
                                className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                            onClick={() => {
                                const total = getTotal();
                                const currentPaid = paidAmount ? Number(paidAmount) : total;

                                if (!selectedClient && currentPaid < total) {
                                    setCheckoutResult({
                                        success: false,
                                        message: "Анонимный покупатель должен оплатить полную стоимость."
                                    });
                                    return;
                                }
                                if (items.length > 0) handleCheckout();
                            }}
                            disabled={isCheckingOut || items.length === 0}
                        >
                            {isCheckingOut ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <CreditCard className="mr-2 h-5 w-5" />
                            )}
                            Оплатить
                        </Button>
                    </div>
                </div >

            </div >

            {/* Result Dialog */}
            < Dialog open={!!checkoutResult} onOpenChange={() => setCheckoutResult(null)}>
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
            </Dialog >

        </div >
    )
}