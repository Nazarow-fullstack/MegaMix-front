"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Briefcase, Calendar, Key, LogOut } from "lucide-react"

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuthStore()
    const router = useRouter()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
        )
    }

    if (!user) {
        router.push("/login")
        return null
    }

    const initials = user.full_name
        ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user.username.substring(0, 2).toUpperCase()

    return (
        <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Профиль</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* User Info Card */}
                <Card className="md:col-span-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <CardHeader className="flex flex-row items-center gap-4 pb-4">
                        <Avatar className="h-20 w-20 border-2 border-zinc-100 dark:border-zinc-800">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                            <AvatarFallback className="text-xl bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{user.full_name || user.username}</CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-100">
                                    <Shield className="w-3 h-3 mr-1" />
                                    {user.role}
                                </Badge>
                                <span className="text-sm text-zinc-400">@{user.username}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-xs uppercase tracking-wider">Телефон</Label>
                                <div className="font-medium">{user.phone || "Не указан"}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-zinc-500 text-xs uppercase tracking-wider">Дата регистрации</Label>
                                <div className="flex items-center gap-2 font-medium">
                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                    {new Date().toLocaleDateString('ru-RU')} {/* Mock date for now if not in user object */}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Card (Mock for now) */}
                <Card className="border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-medium opacity-90">
                            <Briefcase className="w-5 h-5" />
                            Статистика за сегодня
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="text-4xl font-black">0 c.</div>
                            <div className="text-sm opacity-70">Продано товаров</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold opacity-90">0</div>
                            <div className="text-sm opacity-70">Совершенных сделок</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Безопасность</h2>
                <Card className="border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg">Смена пароля</CardTitle>
                        <CardDescription>Обновите ваш пароль для безопасности аккаунта</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label>Текущий пароль</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Новый пароль</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Подтвердите новый пароль</Label>
                            <Input type="password" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
                        <Button variant="outline">Отмена</Button>
                        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
                            <Key className="w-4 h-4 mr-2" />
                            Обновить пароль
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="flex justify-start">
                <Button variant="destructive" onClick={logout} className="mt-4">
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти из аккаунта
                </Button>
            </div>
        </div>
    )
}
