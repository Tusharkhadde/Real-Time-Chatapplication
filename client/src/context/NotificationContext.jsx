import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play notification sound
  const playSound = useCallback((type = 'notification') => {
    if (!soundEnabled) return;
    
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled]);

  // Add notification
  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Play sound
    if (notification.sound !== false) {
      playSound(notification.type || 'notification');
    }

    // Auto-remove after 5 seconds if it's a toast
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }

    return id;
  }, [playSound]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Show toast helpers
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({ type: 'error', message, ...options });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    soundEnabled,
    setSoundEnabled,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    playSound,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;