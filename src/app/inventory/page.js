"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Loader2, RefreshCcw } from "lucide-react"

import { useAuthStore } from "@/store/authStore"
import api from "@/utils/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export default function InventoryPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")

    if (!user || isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700" />
            </div>
        )
    }

    // Role Checks
    const isAdmin = user?.role === "admin"
    const isManager = user?.role === "manager"
    const canSeePrices = isAdmin || isManager
    const canAddProduct = isAdmin
    const canMoveStock = isAdmin || isManager

    // State for Dialogs
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [isMoveStockOpen, setIsMoveStockOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    // Fetch Products
    const { data: products = [], isLoading, isError } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/api/inventory/products')
            return res.data
        }
    })

    // Filter Products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    // Mutations
    const createProductMutation = useMutation({
        mutationFn: async (newProduct) => {
            await api.post('/api/inventory/products', newProduct)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            setIsAddProductOpen(false)
        }
    })

    const moveStockMutation = useMutation({
        mutationFn: async (movement) => {
            await api.post('/api/inventory/movements', movement)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            setIsMoveStockOpen(false)
            setSelectedProduct(null)
        }
    })

    // Handlers
    const handleAddProduct = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        createProductMutation.mutate({
            name: formData.get("name"),
            unit: formData.get("unit"),
            buy_price: parseFloat(formData.get("buy_price") || 0),
            sell_price: parseFloat(formData.get("sell_price") || 0),
            min_stock_level: parseInt(formData.get("min_stock_level") || 0),
            quantity: 0 // New products start with 0 stock usually, or added via distinct movement
        })
    }

    const handleMoveStock = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        moveStockMutation.mutate({
            product_id: parseInt(Number(selectedProduct.id)),
            type: String(formData.get("type")).toLowerCase(),
            change_amount: parseFloat(formData.get("quantity")),
            comment: String(formData.get("comment") || ""),
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Склад</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Управление товарами и запасами</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Поиск товара..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    {canAddProduct && (
                        <Button onClick={() => setIsAddProductOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить товар
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Table Card */}
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Название</TableHead>
                            <TableHead>Ед. изм.</TableHead>
                            <TableHead>Остаток</TableHead>
                            {isAdmin && <TableHead>Закупка</TableHead>}
                            {canSeePrices && <TableHead>Продажа</TableHead>}
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-zinc-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Загрузка данных...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                                        <RefreshCcw className="h-8 w-8 opacity-20" />
                                        <p>Товары не найдены</p>
                                        {canAddProduct && (
                                            <Button variant="link" onClick={() => setIsAddProductOpen(true)}>
                                                Добавить первый товар
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const isLowStock = product.quantity <= product.min_stock_level
                                return (
                                    <TableRow key={product.id} className={isLowStock ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20" : ""}>
                                        <TableCell className="font-mono text-xs text-zinc-500">#{product.id}</TableCell>
                                        <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">{product.name}</TableCell>
                                        <TableCell>{product.unit}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={isLowStock ? "font-bold text-red-600 dark:text-red-400" : ""}>
                                                    {product.quantity}
                                                </span>
                                                {isLowStock && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Мало</Badge>}
                                            </div>
                                        </TableCell>
                                        {isAdmin && <TableCell>{product.buy_price} ₽</TableCell>}
                                        {canSeePrices && <TableCell>{product.sell_price} ₽</TableCell>}
                                        <TableCell className="text-right">
                                            {canMoveStock && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedProduct(product)
                                                        setIsMoveStockOpen(true)
                                                    }}
                                                    title="Движение товара"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Product Dialog */}
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Добавить товар</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Название</Label>
                                <Input id="name" name="name" required className="bg-zinc-50 dark:bg-zinc-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="unit">Ед. изм.</Label>
                                    <Select name="unit" defaultValue="шт">
                                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900">
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="шт">шт</SelectItem>
                                            <SelectItem value="кг">кг</SelectItem>
                                            <SelectItem value="л">л</SelectItem>
                                            <SelectItem value="м">м</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="min_stock_level">Мин. остаток</Label>
                                    <Input id="min_stock_level" name="min_stock_level" type="number" defaultValue="10" className="bg-zinc-50 dark:bg-zinc-900" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="buy_price">Цена закупки</Label>
                                    <Input id="buy_price" name="buy_price" type="number" step="0.01" className="bg-zinc-50 dark:bg-zinc-900" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="sell_price">Цена продажи</Label>
                                    <Input id="sell_price" name="sell_price" type="number" step="0.01" className="bg-zinc-50 dark:bg-zinc-900" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={createProductMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {createProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Создать
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Stock Movement Dialog */}
            <Dialog open={isMoveStockOpen} onOpenChange={setIsMoveStockOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Движение товара: {selectedProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMoveStock}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Тип операции</Label>
                                <Select name="type" defaultValue="IN">
                                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900">
                                        <SelectValue placeholder="Выберите тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN">Приход (+)</SelectItem>
                                        <SelectItem value="OUT">Расход (-)</SelectItem>
                                        <SelectItem value="ADJUSTMENT">Корректировка (=)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Количество</Label>
                                <Input id="quantity" name="quantity" type="number" required min="1" className="bg-zinc-50 dark:bg-zinc-900" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comment">Комментарий</Label>
                                <Input id="comment" name="comment" className="bg-zinc-50 dark:bg-zinc-900" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={moveStockMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                {moveStockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
