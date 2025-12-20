"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    const router = useRouter()
    // Destructure isLoading from store as requested
    const { login, token, isLoading } = useAuthStore()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    // Redirect if already logged in
    useEffect(() => {
        if (token) {
            router.push("/sales")
        }
    }, [token, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!username || !password) {
            setError("Пожалуйста, заполните все поля")
            return
        }

        // login action handles isLoading state in the store
        const success = await login(username, password)

        if (success) {
            router.push("/sales")
        } else {
            const storeError = useAuthStore.getState().error;
            setError(storeError ? "Ошибка входа. Проверьте данные." : "Ошибка входа");
        }
    }

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    }

    const shakeVariants = {
        idle: { x: 0 },
        shake: { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } },
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 text-zinc-50 font-sans">
            {/* Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-violet-600/30 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />

            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-[400px]"
            >
                <motion.div
                    variants={shakeVariants}
                    animate={error ? "shake" : "idle"}
                >
                    <Card className="border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-md">
                        <CardHeader className="space-y-1 text-center pb-2">
                            <CardTitle className="text-3xl font-bold tracking-tight text-white">
                                MegaMix
                            </CardTitle>
                            <CardDescription className="text-zinc-400 text-base">
                                Вход в систему управления
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="grid gap-4 pt-4">
                                {error && (
                                    <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
                                        {error}
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="username" className="text-zinc-300">Имя пользователя</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Введите логин"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                        className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 focus-visible:border-violet-500"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-zinc-300">Пароль</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Введите пароль"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500/50 focus-visible:border-violet-500"
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 border-0"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Вход...
                                        </>
                                    ) : (
                                        "Войти"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Footer / Copyright if needed in future */}
            <div className="absolute bottom-6 text-xs text-zinc-600">
                © 2025 MegaMix Systems
            </div>
        </div>
    )
}
