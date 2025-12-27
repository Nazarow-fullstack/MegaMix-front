"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useExpenseStore } from "@/store/expenseStore"
import { cn } from "@/lib/utils"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Map specific categories to labels and colors
const EXPENSE_CATEGORIES = {
    SALARY: { label: "Зарплата", color: "bg-blue-500 hover:bg-blue-600" },
    RENT: { label: "Аренда", color: "bg-orange-500 hover:bg-orange-600" },
    UTILITIES: { label: "Коммунальные", color: "bg-yellow-500 hover:bg-yellow-600 text-black" }, // black text for yellow
    TAXES: { label: "Налоги", color: "bg-red-500 hover:bg-red-600" },
    OTHER: { label: "Прочее", color: "bg-gray-500 hover:bg-gray-600" },
}

export default function ExpensesPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const {
        expenses,
        isLoading: isExpensesLoading,
        error: storeError,
        fetchExpenses,
        addExpense,
        deleteExpense
    } = useExpenseStore()

    // Dialog States
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [expenseToDelete, setExpenseToDelete] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        amount: "",
        category: "",
        description: ""
    })
    const [formError, setFormError] = useState(null)

    // Initial Fetch
    useEffect(() => {
        if (user) {
            fetchExpenses()
        }
    }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

    // Handlers
    const handleAddSubmit = async (e) => {
        e.preventDefault()
        if (!formData.amount || !formData.category) {
            setFormError("Пожалуйста, заполните сумму и категорию.")
            return
        }

        setIsSubmitting(true)
        const payload = {
            amount: parseFloat(formData.amount),
            category: formData.category.toLowerCase(),
            description: formData.description || ""
        }

        const success = await addExpense(payload)
        setIsSubmitting(false)

        if (success) {
            setIsAddOpen(false)
            setFormData({ amount: "", category: "", description: "" })
            setFormError(null)
        } else {
            setFormError("Не удалось добавить расход. Проверьте данные.")
        }
    }

    const handleDeleteClick = (expense) => {
        setExpenseToDelete(expense)
        setIsDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (expenseToDelete) {
            setIsSubmitting(true)
            const success = await deleteExpense(expenseToDelete.id)
            setIsSubmitting(false)

            if (success) {
                setIsDeleteOpen(false)
                setExpenseToDelete(null)
            }
        }
    }

    // Role Checks
    const isManager = user?.role === 'manager'
    const isAdmin = user?.role === 'admin'
    const isWorker = user?.role === 'worker'

    // 1. Auth Loading
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // 2. User Check
    if (!user) {
        return null
    }

    // 3. Permission Check (Worker)
    if (isWorker) {
        return (
            <div className="p-8 flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="max-w-md border border-destructive/50 bg-destructive/10 p-4 rounded-lg flex items-start gap-4 text-destructive">
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h3 className="font-semibold mb-1">Доступ запрещен</h3>
                        <p className="text-sm opacity-90">
                            У вас нет прав для просмотра этой страницы.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Calculations
    const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Расходы</h1>
                    <p className="text-muted-foreground mt-1">
                        Всего расходов: <span className="font-bold text-foreground">{totalExpenses.toLocaleString('ru-RU')} с.</span>
                    </p>
                </div>
                {(isAdmin || isManager) && (
                    <Button onClick={() => setIsAddOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить расход
                    </Button>
                )}
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>История расходов</CardTitle>
                </CardHeader>
                <CardContent>
                    {storeError ? (
                        <div className="text-destructive">Ошибка загрузки данных: {storeError}</div>
                    ) : isExpensesLoading && expenses.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            Нет записей о расходах.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Категория</TableHead>
                                    <TableHead>Описание</TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead className="text-right">Сумма</TableHead>
                                    {isAdmin && <TableHead className="w-[80px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((expense) => {
                                    const categoryInfo = EXPENSE_CATEGORIES[(expense.category || "").toUpperCase()] || { label: expense.category, color: "bg-gray-500" }

                                    return (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium text-muted-foreground">#{expense.id}</TableCell>
                                            <TableCell>
                                                <Badge className={cn("hover:opacity-80 transition-opacity", categoryInfo.color)}>
                                                    {categoryInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={expense.description}>
                                                {expense.description || "-"}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(expense.created_at || expense.date).toLocaleDateString('ru-RU')}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">
                                                {parseFloat(expense.amount).toLocaleString('ru-RU')} с.
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteClick(expense)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add Expense Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Добавить новый расход</DialogTitle>
                        <DialogDescription>
                            Заполните информацию о расходе. Все поля со звёздочкой обязательны.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Сумма <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Категория <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите категорию" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EXPENSE_CATEGORIES).map(([key, info]) => (
                                        <SelectItem key={key} value={key}>
                                            {info.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Описание
                            </label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Например: Оплата за январь"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {formError && (
                            <div className="text-sm text-destructive font-medium">
                                {formError}
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить расход?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить этот расход? Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>

                    {expenseToDelete && (
                        <div className="py-4 bg-muted/50 rounded-md p-4 text-sm">
                            <p><strong>Сумма:</strong> {parseFloat(expenseToDelete.amount).toLocaleString('ru-RU')} с.</p>
                            <p><strong>Категория:</strong> {EXPENSE_CATEGORIES[expenseToDelete.category]?.label}</p>
                            <p><strong>Описание:</strong> {expenseToDelete.description || "-"}</p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
