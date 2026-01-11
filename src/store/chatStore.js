import { create } from 'zustand';
import { useAuthStore } from './authStore';
import api from '@/utils/axios';

export const useChatStore = create((set, get) => ({
    socket: null,
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

        // WebSocket URL
        const wsUrl = `ws://127.0.0.1:8000/api/chat/ws?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("WS Connected");
            set({ isConnected: true, isConnecting: false });
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // If it's a message, append to list
                if (data.type === 'online_users') {
                    // Assuming backend might implement this
                    // If data is just a message, we do this:
                    // But if data contains type 'online_users', we handle it.
                    // Since instructions were specific about messages, I'll focus on that.
                    // But usually we receive a message object.
                }

                // Append message
                const currentMessages = get().messages;
                // Avoid duplicates if we were optimistic? 
                // Simple append for now as requested.
                // We assume `data` is the message object.
                set({ messages: [...currentMessages, data] });

            } catch (e) {
                console.error("WS Message Error", e);
            }
        };

        socket.onclose = () => {
            console.log("WS Disconnected");
            set({ isConnected: false, isConnecting: false, socket: null });
        };

        socket.onerror = (e) => {
            console.error("WS Error", e);
            set({ isConnected: false, isConnecting: false });
        };

        set({ socket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.close();
        }
        set({ socket: null, isConnected: false });
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
