"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingBag,
    Calendar,
    Lock,
    Loader2,
    AlertTriangle,
    ShieldAlert
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

export default function AnalyticsPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()

    // Filter State
    const [mode, setMode] = useState("quick") // "quick" | "detailed"
    const [quickPeriod, setQuickPeriod] = useState("today") // "today" | "week" | "month"
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())

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

    // Fetch Analytics Data
    const { data: stats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['analytics', user.role, mode, quickPeriod, selectedYear, selectedMonth], // granular keys
        queryFn: async () => {
            const res = await api.get('/api/analytics/stats', { params: queryParams })
            return res.data
        }
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
                <Card className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
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
                            +0% от прошлого периода (Mock)
                        </p>
                    </CardContent>
                </Card>

                {/* 2. NET PROFIT (Admin Only) */}
                <Card className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
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
                <Card className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
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
                            Операционные расходы
                        </p>
                    </CardContent>
                </Card>

                {/* 4. SALES COUNT */}
                <Card className="overflow-hidden border-0 relative shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
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
                            Количество чеков
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
