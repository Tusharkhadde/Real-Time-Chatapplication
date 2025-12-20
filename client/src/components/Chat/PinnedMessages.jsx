import { useState } from 'react';
import { useChat } from '@context/ChatContext';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@components/ui/button';
import { formatDistanceToNow } from '@utils/formatters';

const PinnedMessages = ({ pinnedMessages = [], onUnpin }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const displayMessages = isExpanded ? pinnedMessages : [pinnedMessages[0]];

  return (
    <div className="border-b bg-muted/30">
      <div className="p-2">
        {displayMessages.map((message, index) => (
          <div
            key={message._id}
            className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <Pin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary">
                  {message.sender?.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(message.createdAt)}
                </span>
              </div>
              <p className="text-sm truncate">{message.content}</p>
            </div>

            {onUnpin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onUnpin(message._id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {pinnedMessages.length > 1 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-1 text-xs text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show {pinnedMessages.length - 1} more pinned messages
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PinnedMessages;