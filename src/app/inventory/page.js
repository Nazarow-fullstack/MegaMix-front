"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query" // turbo
import { Plus, Search, Loader2, RefreshCcw, Pencil, Trash } from "lucide-react"
import { Switch } from "@/components/ui/switch"

import { useAuthStore } from "@/store/authStore"
import { useProductStore } from "@/store/productStore"
import api from "@/utils/axios"
import PaginationControls from "@/components/ui/PaginationControls"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

import { useRouter } from "next/navigation"

export default function InventoryPage() {
    const { user, isLoading: isAuthLoading } = useAuthStore()
    const queryClient = useQueryClient()
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const limit = 10

    useEffect(() => {
        if (!isAuthLoading && user && user.role !== "admin") {
            router.replace("/sales")
        }
    }, [user, isAuthLoading, router])

    if (!user || isAuthLoading || user.role !== "admin") {
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
    // Allow everyone to see movement button (Worker requirement), but restrict Edit/Delete to Manager/Admin
    const canMoveStock = true
    const canManage = isAdmin || isManager

    // State for Dialogs
    const [isAddProductOpen, setIsAddProductOpen] = useState(false)
    const [isMoveStockOpen, setIsMoveStockOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isAddPack, setIsAddPack] = useState(false)

    // Selection State
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [productToDelete, setProductToDelete] = useState(null)
    const [productToEdit, setProductToEdit] = useState(null)

    // Store Actions
    const { products, isLoading, fetchProducts, updateProduct, deleteProduct } = useProductStore()

    // Fetch Products
    useEffect(() => {
        fetchProducts(page, limit, search)
    }, [page, search, fetchProducts])

    // Mutations
    const createProductMutation = useMutation({
        mutationFn: async (newProduct) => {
            await api.post('/api/inventory/products', newProduct)
        },
        onSuccess: () => {
            fetchProducts(page, limit, search)
            setIsAddProductOpen(false)
        }
    })

    const moveStockMutation = useMutation({
        mutationFn: async (movement) => {
            await api.post('/api/inventory/movements', movement)
        },
        onSuccess: () => {
            fetchProducts(page, limit, search)
            setIsMoveStockOpen(false)
            setSelectedProduct(null)
        }
    })

    const updateProductMutation = useMutation({
        mutationFn: async (data) => {
            await updateProduct(productToEdit.id, data)
        },
        onSuccess: () => {
            fetchProducts(page, limit, search)
            setIsEditOpen(false)
            setProductToEdit(null)
        }
    })

    const deleteProductMutation = useMutation({
        mutationFn: async (id) => {
            await deleteProduct(id)
        },
        onSuccess: () => {
            fetchProducts(page, limit, search)
            setIsDeleteOpen(false)
            setProductToDelete(null)
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
            sell_price: parseFloat(formData.get("buy_price") || 0), // Dynamic pricing now, initial sell price = buy price
            min_stock_level: parseInt(formData.get("min_stock_level") || 0),
            items_per_pack: isAddPack ? parseInt(formData.get("items_per_pack") || 1) : 1,
            quantity: 0
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

    const handleEdit = (product) => {
        setProductToEdit(product)
        setIsEditOpen(true)
    }

    const handleUpdateProduct = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        updateProductMutation.mutate({
            name: formData.get("name"),
            unit: formData.get("unit"),
            buy_price: parseFloat(formData.get("buy_price") || 0),
            min_stock_level: parseInt(formData.get("min_stock_level") || 0),
            items_per_pack: parseInt(formData.get("items_per_pack") || 1),
        })
    }

    const handleDelete = (product) => {
        setProductToDelete(product)
        setIsDeleteOpen(true)
    }

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProductMutation.mutate(productToDelete.id)
        }
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Склад</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Управление товарами и запасами</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mr-2">
                        <Button variant="secondary" size="sm" className="bg-white dark:bg-zinc-700 shadow-sm text-xs h-8">Товары</Button>
                        <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 text-xs h-8" asChild>
                            <a href="/inventory/history">История</a>
                        </Button>
                    </div>
                    <div className="relative w-full sm:w-[250px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Поиск товара..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="pl-8 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        />
                    </div>
                    {canAddProduct && (
                        <Button onClick={() => setIsAddProductOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white h-10">
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить
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
                            <TableHead>В пачке</TableHead>
                            <TableHead>Остаток</TableHead>
                            {isAdmin && <TableHead>Закупка</TableHead>}
                            {/* {canSeePrices && <TableHead>Продажа</TableHead>} - Removed */}
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
                        ) : products.length === 0 ? (
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
                            products.map((product) => {
                                const isLowStock = product.quantity <= product.min_stock_level
                                return (
                                    <TableRow
                                        key={product.id}
                                        className={`cursor-pointer transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 ${isLowStock ? "bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20" : ""}`}
                                        onClick={() => {
                                            setSelectedProduct(product)
                                            setIsDetailsOpen(true)
                                        }}
                                    >
                                        <TableCell className="font-mono text-xs text-zinc-500">#{product.id}</TableCell>
                                        <TableCell className="font-medium text-zinc-950 dark:text-zinc-50">{product.name}</TableCell>
                                        <TableCell>{product.unit}</TableCell>
                                        <TableCell>{product.items_per_pack || 1} шт/уп</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-black ${isLowStock ? "text-red-600 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                                                    {product.quantity}
                                                </span>
                                                <div className="flex flex-col items-start">
                                                    {isLowStock && <Badge variant="destructive" className="h-4 px-1 text-[9px] mb-0.5">Low</Badge>}
                                                    <span className="text-[10px] text-zinc-400 font-medium">Min: {product.min_stock_level}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {isAdmin && <TableCell>{product.buy_price} ₽</TableCell>}
                                        {/* Sell Price Removed per requirements, canSeePrices no longer shows it here */}
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                {canMoveStock && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedProduct(product)
                                                            setIsMoveStockOpen(true)
                                                        }}
                                                        title="Движение товара"
                                                        className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {(isAdmin || isManager) && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(product)}
                                                            title="Редактировать"
                                                            className="h-8 w-8 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(product)}
                                                            title="Удалить"
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
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
                hasMore={products.length === limit} // Heuristic for list response
                isLoading={isLoading}
            />

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
                                        <SelectContent className="bg-white dark:bg-zinc-950 z-[200]">
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

                            <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                                <Switch
                                    id="is_pack"
                                    checked={isAddPack}
                                    onCheckedChange={setIsAddPack}
                                />
                                <Label htmlFor="is_pack" className="cursor-pointer text-sm font-medium flex-1">
                                    Продается упаковками?
                                </Label>
                            </div>

                            {isAddPack && (
                                <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="items_per_pack">Количество в упаковке (шт/уп)</Label>
                                    <Input
                                        id="items_per_pack"
                                        name="items_per_pack"
                                        type="number"
                                        defaultValue="1"
                                        min="2"
                                        required={isAddPack}
                                        className="bg-zinc-50 dark:bg-zinc-900"
                                    />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="buy_price">Цена закупки (за единицу)</Label>
                                <Input id="buy_price" name="buy_price" type="number" step="0.01" className="bg-zinc-50 dark:bg-zinc-900" />
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
                                    <SelectContent className="bg-white dark:bg-zinc-950 z-[200]">
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

            {/* Edit Product Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle>Редактировать товар</DialogTitle>
                    </DialogHeader>
                    {productToEdit && (
                        <form onSubmit={handleUpdateProduct}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Название</Label>
                                    <Input id="edit-name" name="name" defaultValue={productToEdit.name} required className="bg-zinc-50 dark:bg-zinc-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-unit">Ед. изм.</Label>
                                        <Select name="unit" defaultValue={productToEdit.unit}>
                                            <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900">
                                                <SelectValue placeholder="Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-zinc-950 z-[200]">
                                                <SelectItem value="шт">шт</SelectItem>
                                                <SelectItem value="кг">кг</SelectItem>
                                                <SelectItem value="л">л</SelectItem>
                                                <SelectItem value="м">м</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-items_per_pack">шт/уп (В пачке)</Label>
                                        <Input id="edit-items_per_pack" name="items_per_pack" type="number" defaultValue={productToEdit.items_per_pack || 1} className="bg-zinc-50 dark:bg-zinc-900" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-min_stock_level">Мин. остаток</Label>
                                        <Input id="edit-min_stock_level" name="min_stock_level" type="number" defaultValue={productToEdit.min_stock_level} className="bg-zinc-50 dark:bg-zinc-900" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-buy_price">Цена закупки</Label>
                                        <Input id="edit-buy_price" name="buy_price" type="number" step="0.01" defaultValue={productToEdit.buy_price} className="bg-zinc-50 dark:bg-zinc-900" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateProductMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                                    {updateProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Сохранить
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Товар <b>{productToDelete?.name}</b> будет удален из базы данных навсегда.
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
                            disabled={deleteProductMutation.isPending}
                        >
                            {deleteProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ProductDetailsSheet
                product={selectedProduct}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div >
    )
}

function ProductDetailsSheet({ product, isOpen, onClose }) {
    const {
        movements,
        salesHistory,
        isLoadingHistory,
        fetchProductMovements,
        fetchProductSales,
        clearHistory
    } = useProductStore()

    // Fetch data when sheet opens
    useEffect(() => {
        if (isOpen && product) {
            fetchProductMovements(product.id)
            fetchProductSales(product.id)
        } else {
            clearHistory()
        }
    }, [isOpen, product, fetchProductMovements, fetchProductSales, clearHistory])

    if (!product) return null

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl p-0 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <SheetHeader className="space-y-4">
                            <div>
                                <Badge variant="outline" className="mb-2 text-zinc-500 border-zinc-300 dark:border-zinc-700">
                                    #{product.id} • {product.unit}
                                </Badge>
                                <SheetTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                                    {product.name}
                                </SheetTitle>
                            </div>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Остаток</p>
                                    <span className={`text-2xl font-bold ${product.quantity <= product.min_stock_level ? "text-red-500" : "text-emerald-600"}`}>
                                        {product.quantity}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Цена продажи</p>
                                    <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{product.sell_price} с.</span>
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Цена закупки</p>
                                    <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">{product.buy_price} с.</span>
                                </div>
                            </div>
                        </SheetHeader>
                    </div>

                    {/* Content */}
                    <Tabs defaultValue="movements" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-2">
                            <TabsList className="w-full justify-start border-b border-zinc-200 dark:border-zinc-800 rounded-none bg-transparent p-0 h-10 gap-6">
                                <TabsTrigger
                                    value="movements"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 px-0 pb-2 bg-transparent shadow-none transition-none"
                                >
                                    История движений
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sales"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 px-0 pb-2 bg-transparent shadow-none transition-none"
                                >
                                    История продаж
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* MOVEMENTS TAB */}
                        <TabsContent value="movements" className="flex-1 overflow-hidden p-0 m-0 data-[state=inactive]:hidden">
                            <ScrollArea className="h-[calc(100vh-250px)]">
                                <div className="p-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="w-[100px]">Дата</TableHead>
                                                <TableHead>Тип</TableHead>
                                                <TableHead>Кол-во</TableHead>
                                                <TableHead>Автор</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingHistory ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : movements.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-zinc-400">
                                                        Нет записей о движениях
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                movements.map((m) => (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="text-xs text-zinc-500 font-mono">
                                                            {new Date(m.created_at).toLocaleDateString('ru-RU')}
                                                            <div className="text-[10px] opacity-70">
                                                                {new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={
                                                                m.type === 'in' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                    m.type === 'out' ? "bg-red-50 text-red-700 border-red-200" :
                                                                        "bg-blue-50 text-blue-700 border-blue-200"
                                                            }>
                                                                {m.type === 'in' ? "Приход" : m.type === 'out' ? "Расход" : "Корр."}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-sm">
                                                            {m.type === 'out' ? '-' : '+'}{m.change_amount}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-zinc-600">
                                                            {m.performed_by_name || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        {/* SALES TAB */}
                        <TabsContent value="sales" className="flex-1 overflow-hidden p-0 m-0 data-[state=inactive]:hidden">
                            <ScrollArea className="h-[calc(100vh-250px)]">
                                <div className="p-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Клиент</TableHead>
                                                <TableHead className="text-right">Кол-во</TableHead>
                                                <TableHead className="text-right">Сумма</TableHead>
                                                <TableHead className="text-right">Продавец</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingHistory ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : salesHistory.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-32 text-center text-zinc-400">
                                                        Нет продаж этого товара
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                salesHistory.map((s) => (
                                                    <TableRow key={s.sale_id}>
                                                        <TableCell className="text-xs text-zinc-500 font-mono">
                                                            {new Date(s.sale_date).toLocaleDateString('ru-RU')}
                                                            <div className="text-[10px] opacity-70">
                                                                {new Date(s.sale_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm font-medium">
                                                            {s.client_name || "Аноним"}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-sm">
                                                            {s.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-zinc-600">
                                                            {s.total} c.
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-zinc-500">
                                                            {s.seller_name || "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
