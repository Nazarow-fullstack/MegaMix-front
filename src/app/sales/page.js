"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, ShoppingCart, Trash2, Plus, Minus, CreditCard, RefreshCcw, Grid, Package, AlertCircle, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useAuthStore } from "@/store/authStore"
import { useCartStore } from "@/store/cartStore"

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

function CartItemRow({ item, updateCartItem, removeItem, updateItemPrice, togglePack }) {
    // Local state for inputs to allow smooth typing
    // We sync with store on blur or intentional actions
    const [priceInput, setPriceInput] = useState(item.sold_price?.toString() || "0")

    // Derived state for the "Packs" logic
    const isPack = item.isPack || false
    const packsInput = item.packsInput || 0
    const itemsPerPack = item.items_per_pack || 12 // Default to 12 if missing, or handle gracefully

    const handlePackToggle = (checked) => {
        togglePack(item.id)
    }

    const handlePacksChange = (e) => {
        const val = e.target.value
        const newPacks = parseInt(val)

        // Update local UI state via store (since it drives the quantity)
        if (!isNaN(newPacks) && newPacks >= 0) {
            updateCartItem(item.id, {
                packsInput: newPacks,
                quantity: newPacks * itemsPerPack
            })
        }
    }

    const handleQuantityChange = (e) => {
        // Only allowed if !isPack
        const val = parseInt(e.target.value)
        if (!isNaN(val) && val >= 0) {
            updateCartItem(item.id, { quantity: val })
        }
    }

    const handlePriceChange = (e) => {
        setPriceInput(e.target.value)
    }

    const handlePriceBlur = () => {
        const val = parseFloat(priceInput)
        if (!isNaN(val) && val >= 0) {
            updateItemPrice(item.id, val)
        } else {
            setPriceInput(item.sold_price?.toString() || "0")
        }
    }

    // Sync price input if store changes externally
    useEffect(() => {
        setPriceInput(item.sold_price?.toString() || "0")
    }, [item.sold_price])

    const totalRowPrice = (item.sold_price || 0) * item.quantity

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all 
                ${isPack ? 'bg-violet-50/50 border-violet-100 dark:bg-violet-900/10 dark:border-violet-900/30' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-violet-500/30'}`}
        >
            {/* Header: Name and Remove */}
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {item.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-zinc-500 border-zinc-200 dark:border-zinc-700">
                            {item.unit || "шт"}
                        </Badge>
                        {item.items_per_pack > 1 && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                В пачке: {item.items_per_pack}
                            </Badge>
                        )}
                    </div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-red-500 hover:bg-red-50 -mr-2" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <Separator className="bg-zinc-100 dark:bg-zinc-800/50" />

            {/* Controls Grid */}
            <div className="grid grid-cols-2 gap-3">

                {/* Left Col: Quantity Logic */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id={`pack-check-${item.id}`}
                            checked={isPack}
                            onCheckedChange={handlePackToggle}
                        />
                        <Label htmlFor={`pack-check-${item.id}`} className="text-xs font-medium cursor-pointer select-none">
                            📦 Пачка?
                        </Label>
                    </div>

                    {isPack ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md p-1 pl-2">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Пачек:</span>
                                <Input
                                    className="h-6 w-full p-0 border-0 focus-visible:ring-0 text-right font-bold text-sm bg-transparent"
                                    type="number"
                                    min="1"
                                    value={packsInput}
                                    onChange={handlePacksChange}
                                />
                            </div>
                            <div className="text-[10px] text-zinc-500 text-right px-1">
                                {packsInput} x {itemsPerPack} = <b>{item.quantity}</b> {item.unit}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                            <Button size="icon" variant="ghost" className="h-7 w-8 rounded-md bg-white dark:bg-zinc-700 shadow-sm" onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={handleQuantityChange}
                                className="w-full h-7 p-0 text-center text-sm font-bold bg-transparent border-0 focus-visible:ring-0 shadow-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-8 rounded-md bg-white dark:bg-zinc-700 shadow-sm" onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}>
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Col: Price Logic */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium text-zinc-500 block text-right">
                        Цена за шт.
                    </Label>
                    <div className="relative">
                        <Input
                            className="h-8 text-right pr-2 font-bold bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white transition-colors"
                            value={priceInput}
                            onChange={handlePriceChange}
                            onBlur={handlePriceBlur}
                            type="number"
                        />
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-zinc-400">Итого: </span>
                        <span className="font-black text-sm text-violet-600 dark:text-violet-400">
                            {totalRowPrice.toFixed(0)} c.
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function SalesPage() {
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
    const [page, setPage] = useState(1)
    const limit = 8

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