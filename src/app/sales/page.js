"use client"

import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, ShoppingCart, Trash2, Plus, Minus, CreditCard, RefreshCcw, Grid, Package, AlertCircle, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, User } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useCartStore } from "@/store/cartStore"
import { useChatStore } from "@/store/chatStore"
import { useUserStore } from "@/store/userStore"

import { Button } from "@/components/ui/button"
import PaginationControls from "@/components/ui/PaginationControls"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { Combobox } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"

function CartItemRow({ item, updateCartItem, removeItem, updateItemPrice }) {
    const [priceInput, setPriceInput] = useState(item.sold_price?.toString() || "0")

    // Derived state
    const itemsPerPack = item.items_per_pack || 1
    const isPackMode = itemsPerPack > 1

    // Calculate display values
    // If in pack mode, we show the number of packs (quantity / items per pack)
    const displayQuantity = isPackMode ? (item.quantity / itemsPerPack) : item.quantity

    const handlePriceChange = (e) => setPriceInput(e.target.value)
    const handlePriceBlur = () => {
        const val = parseFloat(priceInput)
        if (!isNaN(val) && val >= 0) updateItemPrice(item.id, val)
        else setPriceInput(item.sold_price?.toString() || "0")
    }

    // Sync price input if store changes externally
    useEffect(() => {
        setPriceInput(item.sold_price?.toString() || "0")
    }, [item.sold_price])

    const totalRowPrice = (item.sold_price || 0) * item.quantity

    const handleQuantityUpdate = (newVal) => {
        if (isNaN(newVal) || newVal < 0) return

        let finalQuantity = newVal
        if (isPackMode) {
            finalQuantity = newVal * itemsPerPack
        }

        updateCartItem(item.id, { quantity: finalQuantity })
    }

    return (
        <div className="group flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm hover:border-violet-500/30 transition-all">
            {/* Top Row: Product Name & Trash */}
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                        {item.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-zinc-500 border-zinc-200 dark:border-zinc-700">
                            {item.unit || "шт"}
                        </Badge>
                        {isPackMode && (
                            <span className="text-[10px] text-zinc-400">
                                {itemsPerPack} шт/уп
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 -mr-1"
                    onClick={() => removeItem(item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <Separator className="bg-zinc-100 dark:bg-zinc-800" />

            {/* Middle Row: Controls */}
            <div className="flex items-center justify-between gap-3">
                {/* Quantity Stepper */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 h-9 w-fit">
                        <button
                            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors"
                            onClick={() => handleQuantityUpdate(Math.max(1, displayQuantity - 1))}
                            disabled={displayQuantity <= 1}
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <input
                            className="w-12 bg-transparent text-center text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={displayQuantity}
                            onChange={(e) => handleQuantityUpdate(parseFloat(e.target.value))}
                            type="number"
                        />
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />
                        <button
                            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            onClick={() => handleQuantityUpdate(displayQuantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </button>

                        {/* Unit Label Next to Input */}
                        <div className="px-2 text-xs font-medium text-zinc-500 border-l border-zinc-200 dark:border-zinc-700 h-full flex items-center">
                            {isPackMode ? "упак." : (item.unit || "шт.")}
                        </div>
                    </div>

                    {/* Helper Text for Packs */}
                    {isPackMode && (
                        <div className="text-[10px] text-zinc-400 pl-1">
                            1 упак = {itemsPerPack} шт.
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Financials */}
            <div className="flex items-center justify-between pt-1">
                {/* Price Input */}
                <div className="flex items-center gap-2 relative">
                    <span className="text-[10px] text-zinc-400 font-medium">
                        Price:
                    </span>
                    <Input
                        className="h-7 w-20 px-1 py-0 text-right text-sm font-bold bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500/30"
                        value={priceInput}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        type="number"
                    />
                </div>

                {/* Subtotal & Total */}
                <div className="text-right">
                    <div className="text-[10px] text-zinc-400 font-medium mb-0.5">
                        {item.quantity} шт × {item.sold_price || 0}
                    </div>
                    <div className="font-black text-violet-600 dark:text-violet-400 text-lg leading-none">
                        {totalRowPrice.toFixed(0)} <span className="text-xs font-bold opacity-70">c.</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function SalesPage() {
    const queryClient = useQueryClient()
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const {
        items,
        addItem,
        removeItem,
        updateCartItem,
        updateItemPrice,
        togglePack,
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
    const [lastSaleDetails, setLastSaleDetails] = useState(null)
    const [page, setPage] = useState(1)
    const limit = 8

    useEffect(() => {
        // Refresh products on mount to avoid stale stock data
        queryClient.invalidateQueries(['products'])
        fetchCatalog({ page, limit })
    }, [page, fetchCatalog, queryClient])

    // ... hydration guard ...
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
        // 1. Запоминаем клиента ПЕРЕД тем, как стор очистится
        const currentClient = useCartStore.getState().selectedClient;
        const clientName = currentClient ? currentClient.label : "Анонимный покупатель";

        const result = await checkout(paidAmount || getTotal());
        
        if (result.success) {
            // 2. Берем ответ от бэка, но если там нет имени клиента, вставляем наше
            const saleData = {
                ...result.data,
                client_name: result.data.client_name || clientName
            };

            // 3. Сохраняем этот "полный" чек для диалога
            setLastSaleDetails(saleData);

            setCheckoutResult({ success: true, message: "Продажа успешно оформлена!" });
            setPaidAmount("");
            queryClient.invalidateQueries(['products']);
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
                        <div className="pb-32 lg:pb-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
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
                                                {product.items_per_pack > 1 && (
                                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                                        <Package className="h-3 w-3" />
                                                        <span>{product.items_per_pack} шт/уп</span>
                                                    </div>
                                                )}
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

                            <PaginationControls
                                page={page}
                                setPage={setPage}
                                hasMore={products.length === limit}
                                isLoading={isLoadingData}
                            />
                        </div>
                    )}
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
                                        <CartItemRow
                                            key={item.id}
                                            item={item}
                                            updateCartItem={updateCartItem}
                                            removeItem={removeItem}
                                            updateItemPrice={updateItemPrice}
                                            togglePack={togglePack}
                                        />
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
            <Dialog open={!!checkoutResult} onOpenChange={() => {
                if (checkoutResult?.success) {
                    // Only allow closing if we are done or if user explicitly wants to
                    setCheckoutResult(null)
                } else {
                    setCheckoutResult(null)
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className={checkoutResult?.success ? "text-emerald-600" : "text-red-600"}>
                            {checkoutResult?.success ? "Успешно" : "Ошибка"}
                        </DialogTitle>
                        <DialogDescription>
                            {checkoutResult?.message}
                        </DialogDescription>
                    </DialogHeader>

                    {checkoutResult?.success && (
                        <div className="flex flex-col gap-3 py-4">
                            <ForwardReceiptDialog
                                receiptData={lastSaleDetails}
                                onClose={() => setCheckoutResult(null)}
                            />
                        </div>
                    )}

                    {!checkoutResult?.success && (
                        <div className="flex justify-end">
                            <Button onClick={() => setCheckoutResult(null)} variant="secondary">
                                Закрыть
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div >
    )
}

function ForwardReceiptDialog({ receiptData, onClose }) {
    const [isOpen, setIsOpen] = useState(false)
    const { users, fetchUsers } = useUserStore()
    const { user } = useAuthStore()
    const { sendMessage } = useChatStore()
    const { selectedClient } = useCartStore()
    const [selectedUser, setSelectedUser] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSend = async () => {
        setIsLoading(true)

        // Standardized Receipt Object construction
        const receiptPayload = {
            id: receiptData.id,
            date: new Date().toISOString(),
            // Logic: If client exists, use full_name, else "Анонимный покупатель"
            client_name: receiptData.client ? receiptData.client.full_name : (selectedClient ? selectedClient.label : "Анонимный покупатель"),
            // Ensure total is a number
            total_amount: Number(receiptData.total_amount || receiptData.total || 0),
            items: (receiptData.items || []).map(item => ({
                // Handle different possible structures (backend response vs local cart)
                product_name: item.product?.name || item.name || "Товар",
                quantity: item.quantity,
                unit: item.product?.unit || item.unit || "шт",
                price: item.price || item.sold_price || 0
            }))
        };

        console.log("SENDING STANDARD RECEIPT:", receiptPayload)

        // Hack: temporarily set active chat to target (in a real app, sendMessage should take recipient)
        const targetChat = selectedUser || 'general';
        useChatStore.getState().setActiveChat(targetChat);

        await sendMessage(JSON.stringify(receiptPayload), 'RECEIPT');

        setIsLoading(false)
        setIsOpen(false)
        onClose() // Close the main success dialog too
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="w-full gap-2" variant="outline">
                <Send className="w-4 h-4" />
                Отправить чек в чат
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Label>Выберите получателя:</Label>
            <ScrollArea className="h-40 border rounded-md bg-white dark:bg-zinc-900">
                <div className="p-2 space-y-1">
                    <button
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${!selectedUser ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                        onClick={() => setSelectedUser(null)}
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                            #
                        </div>
                        <span className="font-medium">Общий чат</span>
                    </button>

                    {users.filter(u => u.id !== user?.id).map(u => (
                        <button
                            key={u.id}
                            className={`w-full flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${selectedUser === u.id ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                            onClick={() => setSelectedUser(u.id)}
                        >
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{u.username || u.full_name}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
            <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setIsOpen(false)}>Отмена</Button>
                <Button className="flex-1" onClick={handleSend} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Отправить
                </Button>
            </div>
        </div>
    )
}