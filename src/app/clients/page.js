"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, Plus, Banknote, User, RefreshCcw, Wallet, FileText, ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useClientStore } from "@/store/clientStore"
import api from "@/utils/axios"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import PaginationControls from "@/components/ui/PaginationControls"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ClientsPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const { history, isHistoryLoading, fetchClientHistory, updateClient, deleteClient, clients, fetchClients, isLoading: isClientsLoading } = useClientStore()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const limit = 20

    // Dialog & Sheet States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState(null)
    const [clientToDelete, setClientToDelete] = useState(null)
    const [isEditing, setIsEditing] = useState(false)

    // Auth Guard
    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
            </div>
        )
    }

    // RBAC
    const canEdit = user?.role === "admin" || user?.role === "manager"
    const canDelete = user?.role === "admin"

    // Fetch Clients Effect
    useEffect(() => {
        fetchClients({ page, limit, search })
    }, [page, search, fetchClients])

    // Fetch History Effect
    useEffect(() => {
        if (isSheetOpen && selectedClient) {
            fetchClientHistory(selectedClient.id)
        }
    }, [isSheetOpen, selectedClient, fetchClientHistory])

    // Use clients directly from store (server-side filtered)

    // Create/Update Client Mutation
    const createOrUpdateClientMutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing && selectedClient) {
                await updateClient(selectedClient.id, data)
            } else {
                await api.post('/api/clients/clients', data)
            }
        },
        onSuccess: () => {
            // Invalidate store by re-fetching
            fetchClients({ page, limit, search })
            setIsCreateOpen(false)
            setIsEditing(false)
            setSelectedClient(null)
        }
    })

    // Delete Client Mutation
    const deleteClientMutation = useMutation({
        mutationFn: async (id) => {
            await deleteClient(id)
        },
        onSuccess: () => {
            fetchClients({ page, limit, search })
            setIsDeleteOpen(false)
            setClientToDelete(null)
        }
    })

    // Payment Mutation
    const paymentMutation = useMutation({
        mutationFn: async (paymentData) => {
            await api.post('/api/clients/payments', paymentData)
        },
        onSuccess: () => {
            fetchClients({ page, limit, search })
            setIsPaymentOpen(false)
            // Optionally close sheet or refresh history if open
            if (isSheetOpen && selectedClient) {
                fetchClientHistory(selectedClient.id)
            }
        }
    })

    const handleSubmitClient = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        createOrUpdateClientMutation.mutate({
            full_name: formData.get("full_name"),
            phone: formData.get("phone")
        })
    }

    const openCreateDialog = () => {
        setIsEditing(false)
        setSelectedClient(null)
        setIsCreateOpen(true)
    }

    const openEditDialog = (client) => {
        setIsEditing(true)
        setSelectedClient(client)
        setIsCreateOpen(true)
    }

    const handleDeleteClick = (client) => {
        setClientToDelete(client)
        setIsDeleteOpen(true)
    }

    const confirmDelete = () => {
        if (clientToDelete) {
            deleteClientMutation.mutate(clientToDelete.id)
        }
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
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="pl-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    {canEdit && (
                        <Button onClick={openCreateDialog} className="bg-violet-600 hover:bg-violet-700 text-white">
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
                        {isClientsLoading ? (
                            <TableRow>
                                <TableCell colSpan={canEdit ? 5 : 4} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-zinc-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Загрузка данных...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canEdit ? 5 : 4} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                                        <RefreshCcw className="h-8 w-8 opacity-20" />
                                        <p>Клиенты не найдены</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => {
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
                                    <TableRow
                                        key={client.id}
                                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                        onClick={() => {
                                            setSelectedClient(client)
                                            setIsSheetOpen(true)
                                        }}
                                    >
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
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedClient(client)
                                                            setIsPaymentOpen(true)
                                                        }}
                                                        title="Внести оплату"
                                                        className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                                    >
                                                        <Banknote className="h-4 w-4" />
                                                    </Button>
                                                    {canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                openEditDialog(client)
                                                            }}
                                                            title="Редактировать"
                                                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteClick(client)
                                                            }}
                                                            title="Удалить"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>

                </Table>
            </div>

            <PaginationControls
                page={page}
                setPage={setPage}
                hasMore={clients.length === limit}
                isLoading={isClientsLoading}
            />

            {/* Client History Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-full flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <SheetTitle className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span>{selectedClient?.full_name}</span>
                                <span className="text-xs font-normal text-zinc-500">{selectedClient?.phone}</span>
                            </div>
                        </SheetTitle>
                        <SheetDescription>
                            История операций и текущий баланс
                        </SheetDescription>
                        <div className="mt-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            <span className="text-sm text-zinc-500">Текущий долг:</span>
                            <span className={`text-lg font-bold ${(selectedClient?.total_debt || 0) > 0 ? "text-red-600" :
                                (selectedClient?.total_debt || 0) < 0 ? "text-green-600" : "text-zinc-600"
                                }`}>
                                {selectedClient?.total_debt || 0} c.
                            </span>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            {isHistoryLoading ? (
                                <div className="flex h-64 items-center justify-center text-zinc-500">
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-violet-500" />
                                    Загрузка истории...
                                </div>
                            ) : !history || history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-zinc-400 opacity-60">
                                    <FileText className="h-12 w-12 mb-3" />
                                    <p>История операций пуста</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-950 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead className="w-[100px]">Дата</TableHead>
                                            <TableHead>Тип</TableHead>
                                            <TableHead>Описание</TableHead>
                                            <TableHead className="text-right">Сумма</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((record, i) => {
                                            const dateString = record.date || record.created_at;
                                            const dateObj = new Date(dateString);
                                            const isValid = !isNaN(dateObj.getTime());

                                            return (
                                                <TableRow key={i}>
                                                    <TableCell className="text-xs text-zinc-500 font-medium">
                                                        {isValid ? dateObj.toLocaleDateString('ru-RU') : "-"}
                                                        <div className="text-[10px] text-zinc-400">
                                                            {isValid ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {record.type === 'payment' ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 gap-1 pl-1 pr-2">
                                                                <ArrowDownLeft className="h-3 w-3" /> Платеж
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 gap-1 pl-1 pr-2">
                                                                <ArrowUpRight className="h-3 w-3" /> Продажа
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-zinc-600 dark:text-zinc-300">
                                                        {record.description || (record.type === 'sale' ? `Продажа #${record.id}` : 'Оплата')}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${record.type === 'payment' ? "text-green-600" : "text-red-600"
                                                        }`}>
                                                        {record.type === 'payment' ? '+' : '-'}{Math.abs(record.amount)} c.
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Create/Edit Client Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Редактировать клиента" : "Новый клиент"}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? "Измените данные клиента." : "Добавьте нового клиента в базу данных."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitClient}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">ФИО Клиента</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    required
                                    defaultValue={isEditing && selectedClient ? selectedClient.full_name : ""}
                                    className="bg-zinc-50 dark:bg-zinc-900"
                                    placeholder="Иван Иванов"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Телефон</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={isEditing && selectedClient ? selectedClient.phone : ""}
                                    className="bg-zinc-50 dark:bg-zinc-900"
                                    placeholder="+992..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createOrUpdateClientMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {createOrUpdateClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Сохранить" : "Создать"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Клиент <b>{clientToDelete?.full_name}</b> будет удален из базы данных навсегда.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                confirmDelete()
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleteClientMutation.isPending}
                        >
                            {deleteClientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
        </div >
    )
}
