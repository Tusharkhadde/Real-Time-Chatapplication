import { io } from 'socket.io-client';

// Socket connects directly to the server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket error:', error.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Emit helpers
export const socketEmit = {
  startTyping: (conversationId) => socket?.emit('typing-start', { conversationId }),
  stopTyping: (conversationId) => socket?.emit('typing-stop', { conversationId }),
  sendMessage: (data) => socket?.emit('send-message', data),
  markRead: (conversationId, messageIds) => socket?.emit('mark-read', { conversationId, messageIds }),
  joinConversation: (conversationId) => socket?.emit('join-conversation', conversationId),
  leaveConversation: (conversationId) => socket?.emit('leave-conversation', conversationId),
  updatePresence: (status) => socket?.emit('update-presence', { status })
};

export default socket;