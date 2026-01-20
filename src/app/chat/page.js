"use client"

import { useState, useEffect, useRef } from "react"
import { useChatStore } from "@/store/chatStore"
import { useUserStore } from "@/store/userStore"
import { useAuthStore } from "@/store/authStore"
import {
    Send, Image as ImageIcon, Search, Phone, Video,
    MoreVertical, ArrowLeft, Paperclip, Check, CheckCheck,
    Loader2, User, Hash
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Fallback for cn if not exists or simple utility
function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function ChatPage() {
    const {
        messages,
        activeChat,
        onlineUsers,
        setActiveChat,
        sendMessage,
        connect,
        uploadImage,
        isConnecting
    } = useChatStore()

    const { users, fetchUsers } = useUserStore()
    const { user: currentUser } = useAuthStore()

    const [search, setSearch] = useState("")
    const [msgInput, setMsgInput] = useState("")
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
    const [previewImage, setPreviewImage] = useState(null) // For image upload preview

    const scrollRef = useRef(null)

    // Initial Data Fetch
    useEffect(() => {
        fetchUsers()
        // connect() - Handled globally in ClientLayout
    }, [fetchUsers]) // Removed connect dependency

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, activeChat])

    const filteredUsers = users.filter(u =>
        u.id !== currentUser?.id && (
            (u.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (u.full_name?.toLowerCase() || "").includes(search.toLowerCase())
        )
    )

    const handleSendMessage = async () => {
        if (!msgInput.trim() && !previewImage) return

        if (previewImage) {
            // Mock upload and send
            // In real world, we'd upload file -> get URL -> send URL
            const url = await uploadImage(previewImage.file)
            sendMessage(url, 'IMAGE')
            setPreviewImage(null)
        }

        if (msgInput.trim()) {
            sendMessage(msgInput, 'TEXT')
            setMsgInput("")
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPreviewImage({
                file,
                url: URL.createObjectURL(file)
            })
        }
    }

    // Active Chat Info
    const activeChatUser = activeChat === 'general'
        ? { username: "Общий чат", full_name: "General Chat", id: 'general' }
        : users.find(u => u.id === activeChat) || { username: "Unknown", id: activeChat }

    return (
        <div className="flex h-[calc(100dvh-1rem)] lg:h-[calc(100dvh-2rem)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm my-2 mx-2 lg:mx-4 relative">

            {/* SIDEBAR - USERS */}
            <div className={cn(
                "flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all duration-300",
                // Conditional Layout Logic
                isMobileChatOpen ? "hidden md:flex md:w-80 md:relative" : "flex w-full md:w-80 md:relative"
            )}>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h1 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Сообщения</h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Поиск..."
                            className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {/* General Chat Item */}
                        <button
                            onClick={() => {
                                setActiveChat('general');
                                setIsMobileChatOpen(true);
                            }}
                            className={classNames(
                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                                activeChat === 'general'
                                    ? "bg-violet-50 dark:bg-violet-900/20"
                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            )}
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                                    <Hash className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={classNames(
                                        "font-semibold truncate",
                                        activeChat === 'general' ? "text-violet-700 dark:text-violet-300" : "text-zinc-900 dark:text-zinc-100"
                                    )}>
                                        Общий чат
                                    </span>
                                    <span className="text-[10px] text-zinc-400">12:30</span>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                    System: Welcome to the Team Chat!
                                </p>
                            </div>
                        </button>

                        <div className="px-2 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mt-2">
                            Сотрудники
                        </div>

                        {filteredUsers.map(u => {
                            // Safe check handling String vs Number mismatch
                            const isOnline = onlineUsers.map(id => String(id)).includes(String(u.id));
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => {
                                        setActiveChat(u.id);
                                        setIsMobileChatOpen(true);
                                    }}
                                    className={classNames(
                                        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                                        activeChat === u.id
                                            ? "bg-violet-50 dark:bg-violet-900/20"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                    )}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden">
                                            <User className="w-6 h-6" />
                                        </div>
                                        {isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className={classNames(
                                                "font-semibold truncate",
                                                activeChat === u.id ? "text-violet-700 dark:text-violet-300" : "text-zinc-900 dark:text-zinc-100"
                                            )}>
                                                {u.username || u.full_name}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                            Click to start chatting
                                        </p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-center text-zinc-400">
                    {isConnecting ? "Connecting..." : "Connected"}
                </div>
            </div>

            {/* CHAT WINDOW */}
            <div className={cn(
                "flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/50 relative overflow-hidden",
                // Conditional Layout Logic
                isMobileChatOpen
                    ? "flex fixed inset-0 z-50 bg-background md:relative md:flex-1 md:z-0"
                    : "hidden md:flex md:flex-1"
            )}>

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://cdn.dribbble.com/users/1210336/screenshots/2787834/media/5e8e84a2ca10298a09f874c7c89fa888.jpg')] bg-fixed bg-cover opacity-5 dark:opacity-[0.02] pointer-events-none" />

                {/* 1. STICKY HEADER */}
                <div className="h-16 flex-none border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur flex items-center px-4 justify-between z-20 relative">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2"
                            onClick={() => setIsMobileChatOpen(false)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
                            {activeChat === 'general' ? <Hash className="w-5 h-5" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-white leading-tight">
                                {activeChat === 'general' ? 'Общий чат' : (activeChatUser?.username || "Loading...")}
                            </h2>
                            <p className="text-xs text-emerald-600 font-medium">
                                {activeChat === 'general' ? `${onlineUsers.length} online` : (onlineUsers.map(id => String(id)).includes(String(activeChat)) ? "Online" : "Offline")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><Phone className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><Video className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
                    </div>
                </div>

                {/* 2. SCROLLABLE MESSAGES */}
                <div className="flex-1 overflow-y-auto relative z-10 w-full">
                    <div className="p-4 space-y-4 min-h-full flex flex-col justify-end w-full">
                        {[...messages]
                            .sort((a, b) => new Date(a.created_at || a.timestamp || 0).getTime() - new Date(b.created_at || b.timestamp || 0).getTime())
                            .map((msg, idx, arr) => {
                                const isMe = msg.sender_id === currentUser?.id || msg.senderId === currentUser?.id || msg.sender === 'Me';
                                const nextMsg = arr[idx + 1];
                                const isStats = nextMsg && nextMsg.senderId === msg.senderId;

                                return (
                                    <div
                                        key={msg.id}
                                        className={classNames(
                                            "flex w-full gap-2 mb-4",
                                            isMe ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {/* Avatar for Others */}
                                        {!isMe && (
                                            <Avatar className="h-8 w-8 mt-1 border border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                                                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs">
                                                    {(msg.sender_name || msg.sender || "?")[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div className={classNames("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                                            {/* Name for Others */}
                                            {!isMe && (
                                                <span className="text-[10px] text-zinc-500 mb-1 ml-1">
                                                    {msg.sender_name || msg.sender || "Unknown"}
                                                </span>
                                            )}

                                            {/* Bubble */}
                                            <div className={classNames(
                                                "rounded-2xl px-4 py-2 shadow-sm relative group transition-all",
                                                isMe
                                                    ? "bg-violet-600 text-white rounded-br-none"
                                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-none"
                                            )}>
                                                {/* CONTENT TYPES */}
                                                {(() => {
                                                    const type = (msg.msg_type || msg.type || 'TEXT').toUpperCase();

                                                    if (type === 'TEXT') return (
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                                    );

                                                    if (type === 'IMAGE') return (
                                                        <div className="rounded-lg overflow-hidden my-1">
                                                            <img
                                                                src={msg.content.startsWith('http') ? msg.content : `http://127.0.0.1:8000${msg.content}`}
                                                                alt="Attachment"
                                                                className="max-w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                                                            />
                                                        </div>
                                                    );

                                                    if (type === 'RECEIPT') return (
                                                        <ReceiptBubble content={msg.content} isMe={isMe} />
                                                    );

                                                    return null;
                                                })()}

                                                {/* Meta */}
                                                <div className={classNames(
                                                    "text-[10px] flex items-center gap-1 mt-1 opacity-70",
                                                    isMe ? "justify-end text-violet-100" : "justify-end text-zinc-500"
                                                )}>
                                                    <span>{new Date(msg.created_at || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMe && <CheckCheck className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        <div ref={scrollRef} />
                    </div>
                </div>

                {/* 3. STICKY INPUT */}
                <div className="flex-none p-3 pb-safe bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 relative z-20">
                    {previewImage && (
                        <div className="absolute bottom-full left-0 m-4 p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <img src={previewImage.url} className="w-16 h-16 object-cover rounded-md" alt="Preview" />
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-zinc-100" onClick={() => setPreviewImage(null)}>
                                <span className="text-xs">✕</span>
                            </Button>
                        </div>
                    )}

                    <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl flex-shrink-0"
                            onClick={() => document.getElementById('chat-upload').click()}
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <input type="file" id="chat-upload" className="hidden" accept="image/*" onChange={handleFileSelect} />

                        <textarea
                            className="flex-1 bg-transparent border-none focus:ring-0 p-2 min-h-[40px] max-h-32 resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 py-2.5"
                            placeholder="Напишите сообщение..."
                            value={msgInput}
                            onChange={(e) => setMsgInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />

                        <Button
                            className={classNames(
                                "h-10 w-10 rounded-xl shadow-lg transition-all flex-shrink-0",
                                msgInput.trim() || previewImage
                                    ? "bg-violet-600 hover:bg-violet-700 text-white scale-100"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 scale-95 opacity-50"
                            )}
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!msgInput.trim() && !previewImage}
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}

function ReceiptBubble({ content, isMe }) {
    let data = {};
    try {
        console.log("PARSING RECEIPT:", content);
        data = typeof content === 'string' ? JSON.parse(content) : content;
        // Fallback for double-stringified JSON which can happen
        if (typeof data === 'string') data = JSON.parse(data);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return <p className="text-red-500 text-xs p-2">Invalid Receipt Data</p>;
    }

    // Standardize data consumption (handle multiple possible legacy formats)
    const total = data.total_amount || data.total || 0;
    const items = data.items || [];
    // Prioritize new field 'client_name', fallback to 'client' or default
    const clientName = data.client_name || data.client || 'Гость';
    const dateStr = data.date ? new Date(data.date).toLocaleDateString() : 'N/A';

    // Calculate items count if not provided directly
    const itemsCount = data.itemsCount || items.length;

    return (
        <div className={classNames(
            "p-3 rounded-lg w-64 my-1 border shadow-sm relative overflow-hidden",
            isMe
                ? "bg-white/10 border-white/20"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        )}>
            {/* Receipt Sawtooth Top (Visual Candy) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[linear-gradient(135deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_100%)] bg-[length:10px_10px]" />

            <div className="flex items-center gap-3 mb-3 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className={classNames("text-xs font-bold uppercase truncate", isMe ? "text-white" : "text-zinc-900 dark:text-white")}>
                        {data.title || "Чек продажи"}
                    </p>
                    <p className={classNames("text-[10px]", isMe ? "text-violet-200" : "text-zinc-500")}>
                        {dateStr} • {clientName}
                    </p>
                </div>
            </div>

            <div className="space-y-1.5 mb-3">
                {items.length > 0 ? items.slice(0, 3).map((item, i) => {
                    // Normalize item fields
                    const itemName = item.product_name || item.name || "Товар";
                    const itemQty = item.quantity || 1;
                    const itemPrice = item.price || item.sold_price || 0;

                    return (
                        <div key={i} className={classNames("text-xs flex flex-col gap-1 border-b border-dashed border-white/10 pb-2 last:border-0", isMe ? "text-violet-50" : "text-zinc-600 dark:text-zinc-300")}>
                            <div className="flex justify-between">
                                <span className="opacity-70">Товар:</span>
                                <span className="font-medium text-right truncate max-w-[140px]">{itemName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Количество:</span>
                                <span className="font-medium">{itemQty} {item.unit || "шт"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Цена:</span>
                                <span className="font-medium">{(itemPrice * itemQty).toFixed(0)} c.</span>
                            </div>
                        </div>
                    )
                }) : (
                    <p className="text-[10px] opacity-70 italic text-center">Нет товаров</p>
                )}

                {(itemsCount > 3) && (
                    <p className="text-[10px] opacity-60 italic text-center mt-1">
                        + еще {Math.max(0, itemsCount - 3)} поз.
                    </p>
                )}
            </div>

            <div className="flex justify-between items-end pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                <span className={classNames("text-xs", isMe ? "text-violet-200" : "text-zinc-500")}>Итого:</span>
                <span className={classNames("text-lg font-black tracking-tight", isMe ? "text-white" : "text-zinc-900 dark:text-white")}>
                    {Number(total).toLocaleString()} <span className="text-xs font-normal opacity-70">c.</span>
                </span>
            </div>
        </div>
    )
}
