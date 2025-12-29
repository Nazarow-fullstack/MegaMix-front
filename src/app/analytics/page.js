"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingBag,
    ShieldAlert,
    Loader2,
    FileText,
    ArrowUpRight,
    ArrowDownLeft,
    Lock,
    Package
} from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import api from "@/utils/axios"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function AnalyticsPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()

    // Filter State
    const [mode, setMode] = useState("quick") // "quick" | "detailed"
    const [quickPeriod, setQuickPeriod] = useState("today") // "today" | "week" | "month"
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())

    // Drill Down State
    const [detailsType, setDetailsType] = useState(null) // 'sales' | 'products' | 'expenses'
    const isSheetOpen = !!detailsType

    // Hydration/Auth Loading Guard
    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
            </div>
        )
    }

    // Worker Access Denied
    if (user.role === "worker") {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Доступ запрещен</h1>
                <p className="text-zinc-500 max-w-sm">У вас нет прав для просмотра финансовой аналитики. Обратитесь к администратору.</p>
            </div>
        )
    }

    // Construct Query Params
    const queryParams = mode === "quick"
        ? { period: quickPeriod }
        : { year: selectedYear, month: selectedMonth }

    // 1. Fetch Analytics Data
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['analytics', user.role, mode, quickPeriod, selectedYear, selectedMonth],
        queryFn: async () => {
            const res = await api.get('/api/analytics/stats', { params: queryParams })
            return res.data
        }
    })

    // 2. Fetch Drill Down Data (Sales)
    const { data: salesList = [], isLoading: isSalesLoading } = useQuery({
        queryKey: ['analytics-sales', mode, quickPeriod, selectedYear, selectedMonth],
        queryFn: async () => {
            const res = await api.get('/api/sales/sales', { params: { ...queryParams, limit: 100 } })
            return res.data
        },
        enabled: isSheetOpen && detailsType === 'sales'
    })

    // 3. Fetch Drill Down Data (Expenses)
    const { data: expensesList = [], isLoading: isExpensesLoading } = useQuery({
        queryKey: ['analytics-expenses', mode, quickPeriod, selectedYear, selectedMonth],
        queryFn: async () => {
            const res = await api.get('/api/expenses', { params: { ...queryParams, limit: 100 } })
            return res.data
        },
        enabled: isSheetOpen && detailsType === 'expenses'
    })

    // 4. Fetch Drill Down Data (Products)
    const { data: productsList = [], isLoading: isProductsLoading } = useQuery({
        queryKey: ['analytics-products', mode, quickPeriod, selectedYear, selectedMonth],
        queryFn: async () => {
            const res = await api.get('/api/analytics/sales-by-product', { params: queryParams })
            return res.data
        },
        enabled: isSheetOpen && detailsType === 'products'
    })

    // Format Currency Helper
    const formatMoney = (amount) => {
        if (amount === null || amount === undefined) return "—"
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'TJS',
            maximumFractionDigits: 0
        }).format(amount).replace("SM", "c.")
    }

    const closeSheet = () => setDetailsType(null)

    return (
        <div className="space-y-8 p-1">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">Аналитика</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Обзор финансовых показателей магазина</p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                    <Tabs value={mode} onValueChange={setMode} className="w-full md:w-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="quick">Быстрый обзор</TabsTrigger>
                            <TabsTrigger value="detailed">По месяцам</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Filters Content */}
            <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {mode === "quick" ? (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={quickPeriod === "today" ? "default" : "outline"}
                            onClick={() => setQuickPeriod("today")}
                            className={quickPeriod === "today" ? "bg-violet-600" : ""}
                        >
                            Сегодня
                        </Button>
                        <Button
                            variant={quickPeriod === "week" ? "default" : "outline"}
                            onClick={() => setQuickPeriod("week")}
                            className={quickPeriod === "week" ? "bg-violet-600" : ""}
                        >
                            Эта неделя
                        </Button>
                        <Button
                            variant={quickPeriod === "month" ? "default" : "outline"}
                            onClick={() => setQuickPeriod("month")}
                            className={quickPeriod === "month" ? "bg-violet-600" : ""}
                        >
                            Этот месяц (30 дней)
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Месяц" />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <SelectItem key={m} value={m.toString()}>
                                        {new Date(0, m - 1).toLocaleString('ru', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Год" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 1. REVENUE (Available to Manager & Admin) */}
                <Card
                    className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                    onClick={() => setDetailsType('sales')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-700 opacity-90" />
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/80">Выручка</CardTitle>
                        <TrendingUp className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isStatsLoading ? (
                            <Skeleton className="h-8 w-3/4 bg-white/20" />
                        ) : (
                            <div className="text-2xl font-bold text-white">
                                {formatMoney(stats?.total_revenue)}
                            </div>
                        )}
                        <p className="text-xs text-white/60 mt-1 flex items-center">
                            Нажмите для детализации
                        </p>
                    </CardContent>
                </Card>

                {/* 2. NET PROFIT (Admin Only) */}
                <Card
                    className={`overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group ${stats?.total_profit === null ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    onClick={() => stats?.total_profit !== null && setDetailsType('sales')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 opacity-90" />
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/80">Чистая Прибыль</CardTitle>
                        {stats?.total_profit === null ? <Lock className="h-4 w-4 text-white/50" /> : <Wallet className="h-4 w-4 text-white" />}
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isStatsLoading ? (
                            <Skeleton className="h-8 w-3/4 bg-white/20" />
                        ) : stats?.total_profit === null ? (
                            <div className="flex items-center gap-2 text-white/80 select-none blur-sm">
                                <span className="text-2xl font-bold">**** c.</span>
                            </div>
                        ) : (
                            <div className="text-2xl font-bold text-white">
                                {formatMoney(stats?.total_profit)}
                            </div>
                        )}
                        <p className="text-xs text-white/60 mt-1">
                            {stats?.total_profit === null ? "Доступ ограничен" : "После вычета расходов"}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. EXPENSES */}
                <Card
                    className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                    onClick={() => setDetailsType('expenses')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-90" />
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/80">Расходы</CardTitle>
                        <TrendingDown className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isStatsLoading ? (
                            <Skeleton className="h-8 w-3/4 bg-white/20" />
                        ) : (
                            <div className="text-2xl font-bold text-white">
                                {formatMoney(stats?.total_expenses)}
                            </div>
                        )}
                        <p className="text-xs text-white/60 mt-1">
                            Нажмите для детализации
                        </p>
                    </CardContent>
                </Card>

                {/* 4. SALES COUNT */}
                <Card
                    className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                    onClick={() => setDetailsType('products')}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-90" />
                    <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-white/80">Продаж</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-white" />
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {isStatsLoading ? (
                            <Skeleton className="h-8 w-3/4 bg-white/20" />
                        ) : (
                            <div className="text-2xl font-bold text-white">
                                {stats?.sales_count || 0}
                            </div>
                        )}
                        <p className="text-xs text-white/60 mt-1">
                            Нажмите для детализации
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Drill Down Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closeSheet()}>
                <SheetContent className="sm:max-w-xl w-full flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <SheetTitle className="flex items-center gap-2">
                            {detailsType === 'sales' && (
                                <>
                                    <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                    История продаж
                                </>
                            )}
                            {detailsType === 'expenses' && (
                                <>
                                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <TrendingDown className="h-4 w-4" />
                                    </div>
                                    Детализация расходов
                                </>
                            )}
                            {detailsType === 'products' && (
                                <>
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>
                                    Проданные товары
                                </>
                            )}
                        </SheetTitle>
                        <SheetDescription>
                            За {mode === 'quick' ?
                                (quickPeriod === 'today' ? 'сегодня' : quickPeriod === 'week' ? 'эту неделю' : 'этот месяц')
                                : `${new Date(0, selectedMonth - 1).toLocaleString('ru', { month: 'long' })} ${selectedYear}`}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            {/* SALES TABLE CONTENT */}
                            {detailsType === 'sales' && (
                                isSalesLoading ? (
                                    <div className="flex h-64 items-center justify-center text-zinc-500">
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-violet-500" />
                                        Загрузка продаж...
                                    </div>
                                ) : salesList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-60">
                                        <ShoppingBag className="h-12 w-12 mb-3" />
                                        <p>Продаж за этот период нет</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Клиент</TableHead>
                                                <TableHead className="text-right">Прибыль</TableHead>
                                                <TableHead className="text-right">Сумма</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {salesList.map((sale) => (
                                                <TableRow key={sale.id}>
                                                    <TableCell className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                                                        {new Date(sale.created_at).toLocaleDateString('ru-RU')} <br />
                                                        <span className="text-[10px] text-zinc-400">
                                                            {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                                                            {sale.client_name || "Анонимный покупатель"}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 flex flex-wrap gap-1 mt-1">
                                                            {sale.items?.map((item, idx) => (
                                                                <span key={idx} className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                                                                    <span className="font-medium text-zinc-700 dark:text-zinc-300 mr-1">
                                                                        {item.product?.name || item.product_name || item.name || "Товар"}
                                                                    </span>
                                                                    <span className="text-zinc-400">x{item.quantity}</span>
                                                                </span>
                                                            )) || "—"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {sale.estimated_profit !== undefined && sale.estimated_profit !== null ? (
                                                            <span className={sale.estimated_profit > 0 ? "text-emerald-600" : sale.estimated_profit < 0 ? "text-red-600" : "text-zinc-500"}>
                                                                {sale.estimated_profit > 0 ? "+" : ""}{formatMoney(sale.estimated_profit)}
                                                            </span>
                                                        ) : (
                                                            <div className="flex justify-end">
                                                                <Lock className="h-3 w-3 text-zinc-400" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-50">
                                                        +{formatMoney(sale.total_amount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )
                            )}

                            {/* EXPENSES CONTENT */}
                            {detailsType === 'expenses' && (
                                isExpensesLoading ? (
                                    <div className="flex h-64 items-center justify-center text-zinc-500">
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-orange-500" />
                                        Загрузка расходов...
                                    </div>
                                ) : expensesList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-60">
                                        <FileText className="h-12 w-12 mb-3" />
                                        <p>Расходов нет</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Категория</TableHead>
                                                <TableHead className="text-right">Сумма</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {expensesList.map((expense) => (
                                                <TableRow key={expense.id}>
                                                    <TableCell className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                                                        {new Date(expense.date).toLocaleDateString('ru-RU')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="mb-1 text-[10px]">{expense.category}</Badge>
                                                        <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                                                            {expense.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                                        -{Math.abs(expense.amount)} c.
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )
                            )}

                            {/* PRODUCTS TABLE CONTENT */}
                            {detailsType === 'products' && (
                                isProductsLoading ? (
                                    <div className="flex h-64 items-center justify-center text-zinc-500">
                                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
                                        Загрузка товаров...
                                    </div>
                                ) : productsList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-60">
                                        <ShoppingBag className="h-12 w-12 mb-3" />
                                        <p>Товары не найдены</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10 shadow-sm">
                                            <TableRow>
                                                <TableHead>Товар</TableHead>
                                                <TableHead className="text-right">Всего Продано</TableHead>
                                                <TableHead className="text-right">Выручка</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {productsList.map((product, idx) => (
                                                <TableRow key={product.product_id || idx} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-violet-500 group-hover:bg-violet-500/20 transition-colors">
                                                                <Package className="h-5 w-5" />
                                                            </div>
                                                            <span className="font-medium text-zinc-700 dark:text-zinc-200">{product.product_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">{product.total_quantity}</span>
                                                            <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-0">
                                                                {product.unit || 'шт'}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-500 text-base font-mono">
                                                            {formatMoney(product.total_revenue)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )
                            )}
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
