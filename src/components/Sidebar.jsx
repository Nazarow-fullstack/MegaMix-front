"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Baby,
    BarChart3,
    Boxes,
    Briefcase,
    DollarSign,
    Users,
    MessageSquare,
    LogOut,
} from "lucide-react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const menuItems = [
    { href: "/sales", label: "Касса", icon: DollarSign, roles: ["admin", "manager"] },
    { href: "/inventory", label: "Склад", icon: Boxes, roles: ["admin"] },
    { href: "/clients", label: "Клиенты", icon: Users, roles: ["admin", "manager"] },
    { href: "/analytics", label: "Аналитика", icon: BarChart3, roles: ["admin", "manager"] },
    { href: "/expenses", label: "Расходы", icon: Briefcase, roles: ["admin", "manager"] },
    { href: "/users", label: "Сотрудники", icon: Baby, roles: ["admin"] },
    { href: "/chat", label: "Сообщения", icon: MessageSquare, roles: ["admin", "manager", "worker"] },
]

export function Sidebar({ setOpen }) {
    const pathname = usePathname()
    const { logout, user } = useAuthStore()

    const userRole = user?.role?.toLowerCase() || 'worker'; // Default to restricted if unknown

    const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

    return (
        <div className="flex h-full flex-col justify-between border-r border-violet-700 bg-gradient-to-b from-violet-800 to-violet-950 text-white">
            <div className="flex flex-col gap-6 py-6">
                <div className="px-6">
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        MegaMix
                    </h2>
                </div>
                <nav className="flex flex-col gap-2 px-3">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen && setOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-white/5",
                                    isActive
                                        ? "bg-white/10 text-white shadow-sm border-l-4 border-violet-300"
                                        : "text-violet-100 border-l-4 border-transparent"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
            <div className="p-4 border-t border-violet-700/50">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-violet-200">Theme</span>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-white hover:bg-white/20 hover:text-white"
                            title="Выйти"
                        >
                            <LogOut className="h-[1.2rem] w-[1.2rem]" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
