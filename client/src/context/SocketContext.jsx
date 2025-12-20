import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initSocket, disconnectSocket, getSocket } from '@services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socketInstance = initSocket(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('✅ Socket connected');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      socketInstance.on('user-status', ({ userId, status }) => {
        setOnlineUsers(prev => {
          if (status === 'online') {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter(id => id !== userId);
          }
        });
      });

      socketInstance.on('online-users', (userIds) => {
        setOnlineUsers(userIds);
      });

      // Request online users list
      socketInstance.emit('get-online-users');

      return () => {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  const emit = useCallback((event, data) => {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, [socket]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const isUserOnline = useCallback((userId) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    emit,
    on,
    off,
    isUserOnline
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;