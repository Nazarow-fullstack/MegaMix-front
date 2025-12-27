"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, Plus, Banknote, User, RefreshCcw, Wallet } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import api from "@/utils/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function ClientsPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState(null)

    // Auth Guard
    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
            </div>
        )
    }

    // RBAC
    const canEdit = user.role === "admin" || user.role === "manager"

    // Fetch Clients
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const res = await api.get('/api/clients/clients')
            return res.data
        }
    })

    // Filter
    const filteredClients = clients.filter(c =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search))
    )

    // Create Client Mutation
    const createClientMutation = useMutation({
        mutationFn: async (newClient) => {
            await api.post('/api/clients/clients', newClient)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clients'])
            setIsCreateOpen(false)
        }
    })

    // Payment Mutation
    const paymentMutation = useMutation({
        mutationFn: async (paymentData) => {
            await api.post('/api/clients/payments', paymentData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clients'])
            setIsPaymentOpen(false)
            setSelectedClient(null)
        }
    })

    const handleCreateClient = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        createClientMutation.mutate({
            full_name: formData.get("full_name"),
            phone: formData.get("phone")
        })
    }

    const handlePayment = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        paymentMutation.mutate({
            client_id: selectedClient.id,
            amount: parseFloat(formData.get("amount")),
            description: formData.get("description") || "Payment"
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Клиенты</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">База клиентов и управление долгами</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Поиск по имени или телефону..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    {canEdit && (
                        <Button onClick={() => setIsCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Новый клиент
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Table */}
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Имя</TableHead>
                            <TableHead>Телефон</TableHead>
                            <TableHead>Долг</TableHead>
                            {canEdit && <TableHead className="text-right">Действия</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-zinc-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Загрузка данных...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canEdit ? 5 : 4} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                                        <RefreshCcw className="h-8 w-8 opacity-20" />
                                        <p>Клиенты не найдены</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => {
                                const debt = client.total_debt || 0
                                let debtBadge = null

                                if (debt > 0) {
                                    debtBadge = <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50">-{debt} c.</Badge>
                                } else if (debt < 0) {
                                    debtBadge = <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50">+{Math.abs(debt)} c.</Badge>
                                } else {
                                    debtBadge = <Badge variant="secondary" className="text-zinc-500">0 c.</Badge>
                                }

                                return (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono text-xs text-zinc-500">#{client.id}</TableCell>
                                        <TableCell className="font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {client.full_name}
                                        </TableCell>
                                        <TableCell className="text-zinc-500">{client.phone || "—"}</TableCell>
                                        <TableCell>
                                            {debtBadge}
                                        </TableCell>
                                        {canEdit && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedClient(client)
                                                        setIsPaymentOpen(true)
                                                    }}
                                                    className="h-8 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/50"
                                                >
                                                    <Banknote className="mr-2 h-4 w-4" />
                                                    Внести оплату
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Client Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Новый клиент</DialogTitle>
                        <DialogDescription>
                            Добавьте нового клиента в базу данных.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateClient}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">ФИО Клиента</Label>
                                <Input id="full_name" name="full_name" required className="bg-zinc-50 dark:bg-zinc-900" placeholder="Иван Иванов" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input id="phone" name="phone" className="bg-zinc-50 dark:bg-zinc-900" placeholder="+992..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createClientMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {createClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Создать
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Внести оплату</DialogTitle>
                        <DialogDescription>
                            Клиент: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedClient?.full_name}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayment}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма оплаты (с.)</Label>
                                <div className="relative">
                                    <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 font-bold text-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Комментарий (опционально)</Label>
                                <Input id="description" name="description" className="bg-zinc-50 dark:bg-zinc-900" placeholder="Частичная оплата..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={paymentMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                {paymentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Обработка...
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="mr-2 h-4 w-4" />
                                        Принять оплату
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
