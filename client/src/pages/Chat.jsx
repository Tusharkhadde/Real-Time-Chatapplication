import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@context/ChatContext';
import { useAuth } from '@context/AuthContext';
import Sidebar from '@components/Sidebar/Sidebar';
import ChatWindow from '@components/Chat/ChatWindow';
import EmptyState from '@components/Chat/EmptyState';
import ChatbotButton from '@components/Chat/ChatbotButton';
import { useMediaQuery } from '@hooks/useMediaQuery';

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    activeConversation, 
    conversations,
    selectConversation,
    fetchConversations,
    loading 
  } = useChat();
  
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [showSidebar, setShowSidebar] = useState(true);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle URL-based conversation selection
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation && activeConversation?._id !== conversationId) {
        selectConversation(conversation);
      }
    }
  }, [conversationId, conversations, activeConversation, selectConversation]);

  // On mobile, handle sidebar visibility based on conversation
  useEffect(() => {
    if (isMobile) {
      setShowSidebar(!activeConversation);
    } else {
      setShowSidebar(true);
    }
  }, [activeConversation, isMobile]);

  const handleSelectConversation = (conversation) => {
    selectConversation(conversation);
    if (conversation) {
      navigate(`/chat/${conversation._id}`, { replace: true });
    }
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBack = () => {
    selectConversation(null);
    navigate('/chat', { replace: true });
    if (isMobile) {
      setShowSidebar(true);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside 
        className={`
          ${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'}
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-full sm:w-80 lg:w-96 flex-shrink-0 
          bg-background border-r
          transition-transform duration-300 ease-in-out
        `}
      >
        <Sidebar onSelectConversation={handleSelectConversation} />
      </aside>

      {/* Mobile overlay */}
      {isMobile && !showSidebar && activeConversation && (
        <div 
          className="absolute inset-0 bg-black/20 z-20 lg:hidden"
          onClick={handleBack}
        />
      )}

      {/* Main Chat Area */}
      <main 
        className={`
          flex-1 flex flex-col min-w-0
          ${isMobile && showSidebar ? 'hidden' : 'flex'}
        `}
      >
        {activeConversation ? (
          <ChatWindow onBack={handleBack} />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Chatbot Button */}
      <ChatbotButton />
    </div>
  );
};

export default Chat;