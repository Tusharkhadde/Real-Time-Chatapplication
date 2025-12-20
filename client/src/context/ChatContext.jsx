import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { conversationAPI, messageAPI } from '@services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { useNotification } from './NotificationContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, on, off, emit, isConnected } = useSocket();
  const { showInfo, playSound } = useNotification();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});

  const typingTimeoutRef = useRef({});

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await conversationAPI.getConversations();
      
      if (response.data.success) {
        setConversations(response.data.data);
        
        // Update unread counts
        const counts = {};
        response.data.data.forEach(conv => {
          counts[conv._id] = conv.unreadCount || 0;
        });
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    if (!conversationId) return;
    
    try {
      setMessagesLoading(true);
      const response = await messageAPI.getMessages(conversationId, { page, limit: 50 });
      
      if (response.data.success) {
        if (page === 1) {
          setMessages(response.data.data);
        } else {
          setMessages(prev => [...response.data.data, ...prev]);
        }
        setHasMoreMessages(response.data.pagination?.hasMore || false);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(async (conversation) => {
    if (!conversation) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    setActiveConversation(conversation);
    setMessages([]);
    setHasMoreMessages(true);
    
    await fetchMessages(conversation._id);
    
    // Mark as read
    try {
      await conversationAPI.markAsRead(conversation._id);
      setUnreadCounts(prev => ({ ...prev, [conversation._id]: 0 }));
      
      // Emit read receipt
      emit('mark-read', { conversationId: conversation._id });
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, [fetchMessages, emit]);

  // Create private conversation
  const createPrivateConversation = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await conversationAPI.createPrivate(userId);
      
      if (response.data.success) {
        const newConv = response.data.data;
        
        // Add to conversations if not exists
        setConversations(prev => {
          const exists = prev.find(c => c._id === newConv._id);
          if (exists) return prev;
          return [newConv, ...prev];
        });
        
        // Select the conversation
        await selectConversation(newConv);
        
        return newConv;
      }
    } catch (err) {
      console.error('Create conversation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectConversation]);

  // Create group conversation
  const createGroupConversation = useCallback(async (name, participantIds) => {
    try {
      setLoading(true);
      const response = await conversationAPI.createGroup({
        name,
        participants: participantIds
      });
      
      if (response.data.success) {
        const newConv = response.data.data;
        setConversations(prev => [newConv, ...prev]);
        await selectConversation(newConv);
        return newConv;
      }
    } catch (err) {
      console.error('Create group error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectConversation]);

  // Send message
 // Update the sendMessage function in ChatContext to support replyTo

const sendMessage = useCallback(async (content, type = 'text', attachments = null, replyToId = null) => {
  if (!activeConversation) return;
  
  try {
    const messageData = {
      conversationId: activeConversation._id,
      content,
      type
    };
    
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }
    
    if (replyToId) {
      messageData.replyTo = replyToId;
    }

    const response = await messageAPI.sendMessage(messageData);
    
    if (response.data.success) {
      playSound?.('send');
      return response.data.data;
    }
  } catch (err) {
    console.error('Send message error:', err);
    throw err;
  }
}, [activeConversation, playSound]);

  // Edit message
  const editMessage = useCallback(async (messageId, content) => {
    try {
      const response = await messageAPI.editMessage(messageId, content);
      
      if (response.data.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, content, isEdited: true, editedAt: new Date() }
            : msg
        ));
        return response.data.data;
      }
    } catch (err) {
      console.error('Edit message error:', err);
      throw err;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const response = await messageAPI.deleteMessage(messageId);
      
      if (response.data.success) {
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        ));
      }
    } catch (err) {
      console.error('Delete message error:', err);
      throw err;
    }
  }, []);

  // Add reaction
  const addReaction = useCallback(async (messageId, emoji) => {
    try {
      await messageAPI.addReaction(messageId, emoji);
    } catch (err) {
      console.error('Add reaction error:', err);
    }
  }, []);

  // Remove reaction
  const removeReaction = useCallback(async (messageId) => {
    try {
      await messageAPI.removeReaction(messageId);
    } catch (err) {
      console.error('Remove reaction error:', err);
    }
  }, []);

  // Start typing
  const startTyping = useCallback(() => {
    if (!activeConversation) return;
    emit('typing-start', { conversationId: activeConversation._id });
  }, [activeConversation, emit]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!activeConversation) return;
    emit('typing-stop', { conversationId: activeConversation._id });
  }, [activeConversation, emit]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || !hasMoreMessages || messagesLoading) return;
    
    const currentPage = Math.ceil(messages.length / 50) + 1;
    await fetchMessages(activeConversation._id, currentPage);
  }, [activeConversation, hasMoreMessages, messagesLoading, messages.length, fetchMessages]);

  // Search messages
  const searchMessages = useCallback(async (query, conversationId = null) => {
    try {
      const params = { q: query };
      if (conversationId) params.conversationId = conversationId;
      
      const response = await messageAPI.searchMessages(params);
      return response.data.data || [];
    } catch (err) {
      console.error('Search messages error:', err);
      return [];
    }
  }, []);

  // Get other participant in private chat
  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation || !user) return null;
    if (conversation.type === 'group') return null;
    
    const other = conversation.participants?.find(
      p => p.user?._id !== user._id
    );
    return other?.user || null;
  }, [user]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // New message received
    const handleNewMessage = ({ message, conversationId }) => {
      console.log('New message received:', message);
      
      // Add to messages if in active conversation
      if (activeConversation?._id === conversationId) {
        setMessages(prev => {
          // Check if message already exists
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        // Mark as read
        emit('mark-read', { conversationId, messageIds: [message._id] });
      } else {
        // Update unread count
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));
        
        // Play notification sound
        if (message.sender?._id !== user?._id) {
          playSound?.('message');
        }
      }
      
      // Update conversation last message
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv._id === conversationId) {
            return { ...conv, lastMessage: message, lastActivity: new Date() };
          }
          return conv;
        });
        // Sort by last activity
        return updated.sort((a, b) => 
          new Date(b.lastActivity) - new Date(a.lastActivity)
        );
      });
    };

    // Message updated
    const handleMessageUpdated = ({ message }) => {
      setMessages(prev => prev.map(m => 
        m._id === message._id ? message : m
      ));
    };

    // Message deleted
    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId 
          ? { ...m, isDeleted: true, content: 'This message was deleted' }
          : m
      ));
    };

    // Reaction updated
    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, reactions } : m
      ));
    };

    // User typing
    const handleUserTyping = ({ conversationId, userId, username, isTyping }) => {
      if (userId === user?._id) return;
      
      setTypingUsers(prev => {
        const convTyping = { ...prev[conversationId] } || {};
        
        if (isTyping) {
          convTyping[userId] = username;
        } else {
          delete convTyping[userId];
        }
        
        return { ...prev, [conversationId]: convTyping };
      });
      
      // Clear typing after timeout
      if (isTyping) {
        if (typingTimeoutRef.current[`${conversationId}-${userId}`]) {
          clearTimeout(typingTimeoutRef.current[`${conversationId}-${userId}`]);
        }
        typingTimeoutRef.current[`${conversationId}-${userId}`] = setTimeout(() => {
          setTypingUsers(prev => {
            const convTyping = { ...prev[conversationId] };
            delete convTyping[userId];
            return { ...prev, [conversationId]: convTyping };
          });
        }, 3000);
      }
    };

    // Messages read
    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (activeConversation?._id === conversationId) {
        setMessages(prev => prev.map(m => {
          if (m.sender?._id === user?._id && !m.readBy?.find(r => r.user === readBy)) {
            return {
              ...m,
              readBy: [...(m.readBy || []), { user: readBy, readAt: new Date() }]
            };
          }
          return m;
        }));
      }
    };

    // Subscribe to events
    on('new-message', handleNewMessage);
    on('message-updated', handleMessageUpdated);
    on('message-deleted', handleMessageDeleted);
    on('message-reaction', handleMessageReaction);
    on('user-typing', handleUserTyping);
    on('messages-read', handleMessagesRead);

    return () => {
      off('new-message', handleNewMessage);
      off('message-updated', handleMessageUpdated);
      off('message-deleted', handleMessageDeleted);
      off('message-reaction', handleMessageReaction);
      off('user-typing', handleUserTyping);
      off('messages-read', handleMessagesRead);
    };
  }, [socket, isConnected, activeConversation, user, on, off, emit, playSound]);

  // Fetch conversations on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Get total unread count
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const value = {
    // State
    conversations,
    activeConversation,
    messages,
    loading,
    messagesLoading,
    error,
    typingUsers,
    hasMoreMessages,
    unreadCounts,
    totalUnreadCount,

    // Actions
    fetchConversations,
    selectConversation,
    createPrivateConversation,
    createGroupConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    loadMoreMessages,
    searchMessages,
    getOtherParticipant,
    setError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;