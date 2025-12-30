"use client"

import { useState, useEffect } from "react"
import { Loader2, Plus, Pencil, Trash2, User, Shield, CreditCard, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { useUserStore } from "@/store/userStore"
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const ROLE_COLORS = {
    admin: "bg-red-500 hover:bg-red-600",
    manager: "bg-blue-500 hover:bg-blue-600",
    worker: "bg-gray-500 hover:bg-gray-600",
}

const ROLE_LABELS = {
    admin: "Администратор",
    manager: "Менеджер",
    worker: "Сотрудник",
}

export default function UsersPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuthStore()
    const {
        users,
        isLoading: isUsersLoading,
        error: storeError,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser
    } = useUserStore()

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [userToDelete, setUserToDelete] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Sheet States
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newPassword, setNewPassword] = useState("")
    const [resetSuccess, setResetSuccess] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        role: "worker"
    })
    const [formError, setFormError] = useState(null)

    // Initial Fetch
    useEffect(() => {
        if (currentUser) {
            fetchUsers()
        }
    }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!isDialogOpen) {
            setEditingUser(null)
            setFormData({ username: "", password: "", role: "worker" })
            setFormError(null)
        } else if (editingUser) {
            setFormData({
                username: editingUser.username,
                password: "", // Keep password empty on edit
                role: editingUser.role?.toLowerCase() || "worker"
            })
        }
    }, [isDialogOpen, editingUser])

    // Reset sheet state when closed
    useEffect(() => {
        if (!isSheetOpen) {
            setNewPassword("")
            setResetSuccess(false)
        }
    }, [isSheetOpen])

    // Handlers
    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormError(null)

        if (!formData.username || !formData.role) {
            setFormError("Заполните обязательные поля.")
            return
        }

        if (!editingUser && !formData.password) {
            setFormError("Пароль обязателен для нового пользователя.")
            return
        }

        setIsSubmitting(true)

        let success = false
        const payload = {
            username: formData.username,
            role: formData.role
        }

        // Only add password if provided (it's optional on update)
        if (formData.password) {
            payload.password = formData.password
        }

        if (editingUser) {
            success = await updateUser(editingUser.id, payload)
        } else {
            success = await createUser(payload)
        }

        setIsSubmitting(false)

        if (success) {
            setIsDialogOpen(false)
        } else {
            setFormError("Не удалось сохранить пользователя.")
        }
    }

    const handleRowClick = (user) => {
        setSelectedUser(user)
        setIsSheetOpen(true)
    }

    const handleEditClick = (e, user) => {
        e.stopPropagation() // Prevent row click
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const handleDeleteClick = (e, user) => {
        e.stopPropagation() // Prevent row click
        setUserToDelete(user)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (userToDelete) {
            setIsSubmitting(true)
            const success = await deleteUser(userToDelete.id)
            setIsSubmitting(false)

            if (success) {
                setIsDeleteDialogOpen(false)
                setUserToDelete(null)
                // If the deleted user was open in sheet, close it
                if (selectedUser?.id === userToDelete.id) {
                    setIsSheetOpen(false)
                    setSelectedUser(null)
                }
            }
        }
    }

    const handlePasswordReset = async () => {
        if (!selectedUser || !newPassword) return

        setIsResetting(true)
        const success = await updateUser(selectedUser.id, { password: newPassword })
        setIsResetting(false)

        if (success) {
            setResetSuccess(true)
            setNewPassword("")
            // Hide success message after 3 seconds
            setTimeout(() => setResetSuccess(false), 3000)
        }
    }

    // Role Checks
    const isAdmin = currentUser?.role === 'admin'

    // 1. Auth Loading
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // 2. User Check
    if (!currentUser) {
        return null
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Сотрудники</h1>
                    <p className="text-muted-foreground mt-1">
                        Управление пользователями системы.
                    </p>
                </div>
                {isAdmin && (
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить сотрудника
                    </Button>
                )}
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>Список пользователей</CardTitle>
                </CardHeader>
                <CardContent>
                    {storeError ? (
                        <div className="text-destructive">Ошибка загрузки данных: {storeError}</div>
                    ) : isUsersLoading && users.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            Нет пользователей.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Пользователь</TableHead>
                                    <TableHead>Роль</TableHead>
                                    <TableHead>Статус</TableHead>
                                    {isAdmin && <TableHead className="w-[100px] text-right">Действия</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => {
                                    const roleKey = user.role?.toLowerCase()
                                    return (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(user)}
                                        >
                                            <TableCell className="font-medium text-muted-foreground">#{user.id}</TableCell>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>
                                                <Badge className={cn("hover:opacity-80 transition-opacity", ROLE_COLORS[roleKey] || "bg-gray-500")}>
                                                    {ROLE_LABELS[roleKey] || user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_active !== false ? (
                                                    <Badge variant="outline" className="border-green-500 text-green-500">Активен</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-red-500 text-red-500">Неактивен</Badge>
                                                )}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={(e) => handleEditClick(e, user)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => handleDeleteClick(e, user)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Редактировать сотрудника' : 'Добавить нового сотрудника'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Измените данные пользователя. Оставьте пароль пустым, чтобы не менять его.' : 'Заполните данные для создания нового пользователя.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Имя пользователя <span className="text-destructive">*</span>
                            </label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Пароль {editingUser ? '(опционально)' : <span className="text-destructive">*</span>}
                            </label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={editingUser ? "••••••••" : "Введите пароль"}
                                required={!editingUser}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Роль <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите роль" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Администратор</SelectItem>
                                    <SelectItem value="manager">Менеджер</SelectItem>
                                    <SelectItem value="worker">Сотрудник</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formError && (
                            <div className="text-sm text-destructive font-medium">
                                {formError}
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingUser ? 'Сохранить изменения' : 'Создать'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить пользователя?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить пользователя <strong>{userToDelete?.username}</strong>? Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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

            {/* User Details Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:w-[540px]">
                    <SheetHeader className="pr-10">
                        <SheetTitle>Детали пользователя</SheetTitle>
                        <SheetDescription>
                            Полная информация о сотруднике и управление доступом.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedUser && (
                        <div className="mt-8 flex flex-col gap-6 px-6">
                            {/* User Header */}
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                                    <User className="h-10 w-10" />
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-2xl font-bold text-foreground">{selectedUser.username}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-sm font-normal py-1 px-3 border-foreground/20">
                                            {ROLE_LABELS[selectedUser.role?.toLowerCase()] || selectedUser.role}
                                        </Badge>
                                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border",
                                            selectedUser.is_active !== false
                                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50"
                                                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
                                        )}>
                                            {selectedUser.is_active !== false ? "Активен" : "Неактивен"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Info */}
                            <div className="grid gap-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Основная информация</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                                        <span className="text-xs text-muted-foreground font-medium">ID Сотрудника</span>
                                        <div className="font-mono text-sm font-semibold text-foreground">#{selectedUser.id}</div>
                                    </div>
                                    <div className="space-y-1.5 p-3 rounded-lg border bg-muted/30">
                                        <span className="text-xs text-muted-foreground font-medium">Дата регистрации</span>
                                        <div className="text-sm font-semibold text-foreground">
                                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('ru-RU') : "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Admin Zone: Password Reset */}
                            {isAdmin && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-destructive font-semibold">
                                        <Shield className="h-5 w-5" />
                                        <span>Зона администратора</span>
                                    </div>

                                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white dark:bg-red-950 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
                                                <KeyRound className="h-6 w-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-red-900 dark:text-red-200">Сброс пароля</h4>
                                                <p className="text-sm text-red-700 dark:text-red-300/80 leading-relaxed">
                                                    Установите новый пароль для сотрудника. Это действие нельзя отменить, старый пароль перестанет действовать.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Input
                                                type="text"
                                                className="bg-white dark:bg-background border-red-200 focus-visible:ring-red-500 h-11"
                                                placeholder="Введите новый пароль"
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value)
                                                    setResetSuccess(false)
                                                }}
                                            />
                                            <Button
                                                className="w-full bg-red-600 hover:bg-red-700 text-white border-none h-11 font-medium shadow-sm active:scale-[0.98] transition-all"
                                                onClick={handlePasswordReset}
                                                disabled={isResetting || !newPassword}
                                            >
                                                {isResetting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                                Обновить пароль
                                            </Button>
                                        </div>

                                        {resetSuccess && (
                                            <div className="flex items-center justify-center gap-2 text-green-700 text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/50 animate-in fade-in zoom-in-95">
                                                <CheckCircle2 className="h-5 w-5" />
                                                <span className="font-semibold">Пароль успешно обновлен</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
