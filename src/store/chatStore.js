import { create } from 'zustand';
import { useAuthStore } from './authStore';
import api from '@/utils/axios';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'sonner';

export const useChatStore = create((set, get) => ({
    socket: null,
    reconnectTimeout: null,
    messages: [], // Array of message objects
    activeChat: 'general', // 'general' or userId
    onlineUsers: [], // List of online user IDs
    isConnected: false,
    isConnecting: false,
    isLoading: false,

    connect: () => {
        const token = useAuthStore.getState().token;
        if (!token || get().isConnected) return;

        set({ isConnecting: true });

        // Dynamic WebSocket URL
        const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
        const wsBase = API_BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}://${wsBase}/api/chat/ws?token=${token}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WS Connected");
            set({ isConnected: true, isConnecting: false });
            // Clear any existing reconnect timeout if we engaged slightly before
            const { reconnectTimeout } = get();
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                set({ reconnectTimeout: null });
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle Online Users Update
                if (data.type === 'online_users') {
                    set({ onlineUsers: data.users || [] });
                    return;
                }

                // Handle Incoming Message
                const currentMessages = get().messages;

                // Avoid duplicates if needed, but for now just appending
                set({ messages: [...currentMessages, data] });

                // Notification Logic
                const { activeChat } = get();
                const { user: currentUser } = useAuthStore.getState();

                // Check if message is from someone else AND not in the active chat
                // Data structure assumption: data.sender_id or data.senderId
                const senderId = data.sender_id || data.senderId;

                if (senderId && currentUser && senderId !== currentUser.id) {
                    // Start sound effect if wanted (optional)

                    if (Number(senderId) !== Number(activeChat)) {
                        toast.info(`New message from ${data.sender_name || 'User'}`);
                    }
                }

            } catch (e) {
                console.error("WS Message Error", e);
            }
        };

        socket.onclose = () => {
            console.log("WS Disconnected");
            set({ isConnected: false, isConnecting: false });

            // Auto-reconnect if socket is not explicitly nulled (meaning we didn't call disconnect)
            const { socket: currentSocket } = get();
            if (currentSocket) {
                console.log("Attempting to reconnect in 3s...");
                const timeout = setTimeout(() => {
                    get().connect();
                }, 3000);
                set({ reconnectTimeout: timeout });
            }
        };

        socket.onerror = (e) => {
            console.error("WS Error", e);
            // onerror will usually be followed by onclose, so we handle logic there
        };

        set({ socket });
    },

    disconnect: () => {
        const { socket, reconnectTimeout } = get();
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
        if (socket) {
            // Remove listener to prevent onclose firing reconnection logic
            socket.onclose = null;
            socket.close();
        }
        set({ socket: null, isConnected: false, reconnectTimeout: null });
    },

    setActiveChat: async (chatId) => {
        set({ activeChat: chatId });
        await get().fetchHistory(chatId);
    },

    fetchHistory: async (recipientId) => {
        set({ isLoading: true, messages: [] });
        try {
            const params = {};
            if (recipientId !== 'general') {
                params.recipient_id = recipientId;
            }

            const res = await api.get('/api/chat/history', { params });
            set({ messages: res.data });
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            set({ isLoading: false });
        }
    },

    sendMessage: (content, type = 'TEXT') => {
        const { socket, activeChat } = get();

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("Socket not connected");
            return;
        }

        const recipientId = activeChat === 'general' ? null : activeChat;

        const payload = {
            content,
            msg_type: type, // Backend expects snake_case probably? User said msg_type
            recipient_id: recipientId
        };

        // Ensure recipient_id is integer if needed, or null
        // payload format requested: { content: "...", msg_type: "...", recipient_id: ... }

        socket.send(JSON.stringify(payload));
    },

    uploadImage: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/api/chat/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.url; // Assuming backend returns { url: "/static/..." }
        } catch (error) {
            console.error("Failed to upload image", error);
            return null;
        }
    }
}));
