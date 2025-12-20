import { memo, useMemo } from 'react';
import MessageItem from './MessageItem';
import { formatDate } from '@utils/formatters';

const MessageList = memo(({ messages, currentUserId, onReply }) => {
  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          type: 'date',
          date: message.createdAt,
          id: `date-${messageDate}`
        });
      }

      const prevMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      
      const showAvatar = 
        !prevMessage || 
        prevMessage.sender?._id !== message.sender?._id ||
        new Date(message.createdAt) - new Date(prevMessage.createdAt) > 300000; // 5 min gap

      const isLastInGroup = 
        !nextMessage ||
        nextMessage.sender?._id !== message.sender?._id ||
        new Date(nextMessage.createdAt) - new Date(message.createdAt) > 300000;

      groups.push({
        type: 'message',
        message,
        showAvatar,
        isLastInGroup,
        id: message._id
      });
    });

    return groups;
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 bg-muted rounded-full mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-muted-foreground font-medium">No messages yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {groupedMessages.map((item) => {
        if (item.type === 'date') {
          return (
            <div key={item.id} className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground font-medium">
                {formatDate(item.date)}
              </div>
            </div>
          );
        }

        const isOwn = item.message.sender?._id === currentUserId;

        return (
          <div key={item.id} id={`message-${item.message._id}`}>
            <MessageItem
              message={item.message}
              isOwn={isOwn}
              showAvatar={item.showAvatar}
              isLastInGroup={item.isLastInGroup}
              onReply={() => onReply?.(item.message)}
            />
          </div>
        );
      })}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;