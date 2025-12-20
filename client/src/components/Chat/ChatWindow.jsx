import { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '@context/ChatContext';
import { useAuth } from '@context/AuthContext';
import { useSocket } from '@context/SocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MessageSearch from './MessageSearch';
import TypingIndicator from './TypingIndicator';
import ChatHeader from './ChatHeader';
import { Loader2 } from 'lucide-react';

const ChatWindow = ({ onBack }) => {
  const { 
    activeConversation, 
    messages, 
    messagesLoading,
    typingUsers,
    loadMoreMessages,
    hasMoreMessages
  } = useChat();
  const { user } = useAuth();
  
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Typing users for this conversation
  const currentTypingUsers = typingUsers[activeConversation?._id] || {};
  const typingUsernames = Object.values(currentTypingUsers);

  // Check if user is near bottom of messages
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < 100);

    // Load more messages when scrolling to top
    if (scrollTop < 50 && hasMoreMessages && !loadingMore) {
      setLoadingMore(true);
      loadMoreMessages().finally(() => setLoadingMore(false));
    }
  }, [hasMoreMessages, loadingMore, loadMoreMessages]);

  // Scroll to bottom on new messages (if near bottom)
  useEffect(() => {
    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  // Scroll to bottom on conversation change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }, [activeConversation?._id]);

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full relative bg-background">
      {/* Search Overlay */}
      {showSearch && (
        <MessageSearch onClose={() => setShowSearch(false)} />
      )}

      {/* Header */}
      <ChatHeader 
        onBack={onBack}
        onSearchClick={() => setShowSearch(true)}
      />

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto chat-pattern"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        {/* Messages */}
        <div className="p-4">
          {messagesLoading && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : (
            <MessageList 
              messages={messages} 
              currentUserId={user?._id}
              onReply={handleReply}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsernames.length > 0 && (
        <TypingIndicator usernames={typingUsernames} />
      )}

      {/* Scroll to bottom button */}
      {!isNearBottom && messages.length > 0 && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-6 p-2 bg-background border rounded-full shadow-lg hover:bg-muted transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Message Input */}
      <MessageInput 
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
};

export default ChatWindow;