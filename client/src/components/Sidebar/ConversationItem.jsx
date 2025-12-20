import { memo } from 'react';
import { useChat } from '@context/ChatContext';
import { useSocket } from '@context/SocketContext';
import { useAuth } from '@context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { formatDistanceToNow } from '@utils/formatters';
import { Users, Image, FileText, Mic, Check, CheckCheck } from 'lucide-react';

const ConversationItem = memo(({ conversation, isActive, onClick }) => {
  const { user } = useAuth();
  const { unreadCounts, getOtherParticipant, typingUsers } = useChat();
  const { isUserOnline } = useSocket();
  
  const unreadCount = unreadCounts[conversation._id] || 0;
  const isGroup = conversation.type === 'group';
  const currentTypingUsers = typingUsers[conversation._id] || {};
  const typingUsernames = Object.values(currentTypingUsers);
  
  // Get display info
  let displayName, displayAvatar, isOnline;
  
  if (isGroup) {
    displayName = conversation.groupInfo?.name || 'Group Chat';
    displayAvatar = conversation.groupInfo?.avatar;
    isOnline = false;
  } else {
    const otherUser = getOtherParticipant(conversation);
    displayName = otherUser?.username || 'Unknown User';
    displayAvatar = otherUser?.avatar;
    isOnline = otherUser ? isUserOnline(otherUser._id) : false;
  }

  // Get last message preview
  const lastMessage = conversation.lastMessage;
  let lastMessageText = '';
  let lastMessageIcon = null;
  let isOwnMessage = false;
  
  if (typingUsernames.length > 0) {
    lastMessageText = typingUsernames.length === 1 
      ? `${typingUsernames[0]} is typing...`
      : 'Several people typing...';
  } else if (lastMessage) {
    isOwnMessage = lastMessage.sender?._id === user?._id || 
                   lastMessage.sender === user?._id;
    
    if (lastMessage.type === 'system') {
      lastMessageText = lastMessage.content;
    } else if (lastMessage.isDeleted) {
      lastMessageText = 'Message deleted';
    } else if (lastMessage.type === 'image') {
      lastMessageIcon = <Image className="h-3 w-3" />;
      lastMessageText = 'Photo';
    } else if (lastMessage.type === 'file') {
      lastMessageIcon = <FileText className="h-3 w-3" />;
      lastMessageText = 'File';
    } else if (lastMessage.type === 'audio') {
      lastMessageIcon = <Mic className="h-3 w-3" />;
      lastMessageText = 'Voice message';
    } else {
      lastMessageText = lastMessage.content || '';
    }
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer
        transition-all duration-200
        ${isActive 
          ? 'bg-primary/10 shadow-sm' 
          : 'hover:bg-muted/50'
        }
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className={`h-12 w-12 ${isActive ? 'ring-2 ring-primary' : ''}`}>
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback className={isGroup ? 'bg-purple-500 text-white' : ''}>
            {isGroup ? <Users className="h-5 w-5" /> : getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator */}
        {!isGroup && isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full online-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`font-medium truncate ${unreadCount > 0 ? 'text-foreground' : ''}`}>
            {displayName}
          </h3>
          {lastMessage && (
            <span className={`text-xs flex-shrink-0 ${
              unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
              {formatDistanceToNow(lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-sm truncate flex items-center gap-1 ${
            typingUsernames.length > 0 
              ? 'text-primary' 
              : unreadCount > 0 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground'
          }`}>
            {/* Read receipt for own messages */}
            {isOwnMessage && !typingUsernames.length && (
              <span className="flex-shrink-0">
                {lastMessage?.readBy?.length > 1 ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            )}
            
            {/* Message icon */}
            {lastMessageIcon && (
              <span className="flex-shrink-0">{lastMessageIcon}</span>
            )}
            
            {/* Message text */}
            <span className="truncate">
              {isOwnMessage && !typingUsernames.length ? 'You: ' : ''}
              {lastMessageText || 'No messages yet'}
            </span>
          </p>
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;