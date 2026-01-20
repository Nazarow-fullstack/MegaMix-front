"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Menu, Loader2 } from "lucide-react"

import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { replace } from "lucide-react"
import { Toaster } from "sonner" // This line seems to be an error in my thought process, ignoring. 
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"

export function ClientLayout({ children }) {
    const pathname = usePathname()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const { connect, disconnect } = useChatStore()
    const { token, isLoading, checkAuth } = useAuthStore()
    const [isClientReady, setIsClientReady] = useState(false)

    // Initial auth check on mount
    useEffect(() => {
        checkAuth()
        setIsClientReady(true)
    }, [checkAuth])

    // Global WebSocket Connection
    useEffect(() => {
        if (token) {
            connect()
        } else {
            disconnect()
        }
        // Cleanup on unmount (optional, but good practice if layout unmounts completely)
        // return () => disconnect() 
    }, [token, connect, disconnect])

    // Route protection logic
    useEffect(() => {
        if (!isLoading && isClientReady) {
            if (!token && pathname !== "/login") {
                router.push("/login")
            }
        }
    }, [token, pathname, isLoading, isClientReady, router])


    // If login page, render only children (fullscreen)
    if (pathname === "/login") {
        // Determine if we should show the login page or wait for auth check
        // If we have a token, the login page itself handles redirect to /sales
        // But to avoid flash, we can return null if we suspect we are authenticated but loading
        if (isLoading) return null;
        return <>{children}</>
    }

    // Show loading spinner while checking auth status to prevent content flash
    if (isLoading || !isClientReady) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        )
    }

    // If not authenticated and not on login page, we are redirecting (handled by useEffect), so render nothing or loader
    if (!token) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden w-64 shrink-0 flex-col lg:flex">
                <Sidebar setOpen={setSidebarOpen} />
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6 lg:hidden">
                    <div className="flex items-center gap-4">
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open Menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64 border-r-0 p-0">
                                <SheetTitle className="sr-only">Menu</SheetTitle>
                                <Sidebar setOpen={setSidebarOpen} />
                            </SheetContent>
                        </Sheet>
                        <span className="text-lg font-bold">MegaMix</span>
                    </div>
                </header>

                {/* Content with Animation */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="mx-auto h-full max-w-7xl"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
            <Toaster richColors closeButton />
        </div>
    )
}
