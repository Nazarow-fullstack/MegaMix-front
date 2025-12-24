"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2, Calendar as CalendarIcon, ArrowLeft } from "lucide-react"

import api from "@/utils/axios"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function StockHistoryPage() {
    const currentYear = new Date().getFullYear()
    const [year, setYear] = useState(currentYear.toString())
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString())

    const { data: stockReport = [], isLoading, isError, refetch, isFetched } = useQuery({
        queryKey: ['stock-report', year, month],
        queryFn: async () => {
            const res = await api.get('/api/analytics/stock-report', {
                params: { year, month }
            })
            return res.data
        },
        enabled: false
    })

    const months = [
        { value: "1", label: "Январь" },
        { value: "2", label: "Февраль" },
        { value: "3", label: "Март" },
        { value: "4", label: "Апрель" },
        { value: "5", label: "Май" },
        { value: "6", label: "Июнь" },
        { value: "7", label: "Июль" },
        { value: "8", label: "Август" },
        { value: "9", label: "Сентябрь" },
        { value: "10", label: "Октябрь" },
        { value: "11", label: "Ноябрь" },
        { value: "12", label: "Декабрь" },
    ]

    const years = [2023, 2024, 2025, 2026]

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <a href="/inventory">
                        <ArrowLeft className="h-4 w-4" />
                    </a>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">История остатков</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Архив состояния склада на конец месяца</p>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                        <div className="flex gap-4 w-full sm:w-auto">
                            <div className="space-y-1 w-full sm:w-[150px]">
                                <label className="text-xs font-medium text-zinc-500">Год</label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 w-full sm:w-[150px]">
                                <label className="text-xs font-medium text-zinc-500">Месяц</label>
                                <Select value={month} onValueChange={setMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            onClick={() => refetch()}
                            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarIcon className="mr-2 h-4 w-4" />}
                            Показать отчет
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50">
                                <TableHead className="w-[50%]">Товар</TableHead>
                                <TableHead>Ед. изм.</TableHead>
                                <TableHead className="text-right">Остаток</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!isFetched ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-zinc-500">
                                        Выберите период и нажмите "Показать отчет"
                                    </TableCell>
                                </TableRow>
                            ) : stockReport.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-zinc-500">
                                        Нет данных за выбранный период
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stockReport.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium">{item.name || item.product_name}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                                            {item.historical_quantity}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
