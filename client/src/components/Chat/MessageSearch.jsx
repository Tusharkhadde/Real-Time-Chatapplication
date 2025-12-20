import { useState, useEffect, useRef } from 'react';
import { useChat } from '@context/ChatContext';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from '@utils/formatters';

const MessageSearch = ({ onClose }) => {
  const { searchMessages, activeConversation } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchMessages(query, activeConversation?._id);
        setResults(data || []);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, activeConversation, searchMessages]);

  const navigateResult = (direction) => {
    if (results.length === 0) return;
    
    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : results.length - 1;
    } else {
      newIndex = currentIndex < results.length - 1 ? currentIndex + 1 : 0;
    }
    
    setCurrentIndex(newIndex);
    scrollToMessage(results[newIndex]._id);
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-500/20');
      setTimeout(() => {
        element.classList.remove('bg-yellow-500/20');
      }, 2000);
    }
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (results.length > 0) {
        scrollToMessage(results[currentIndex]._id);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateResult('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateResult('down');
    }
  };

  return (
    <div className="absolute inset-x-0 top-0 z-50 bg-background border-b shadow-lg">
      {/* Search Input */}
      <div className="p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in conversation..."
            className="pl-9 pr-20"
          />
          
          {/* Results count */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!loading && results.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} of {results.length}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateResult('up')}
            disabled={results.length === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigateResult('down')}
            disabled={results.length === 0}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t">
          {results.map((message, index) => (
            <div
              key={message._id}
              onClick={() => {
                setCurrentIndex(index);
                scrollToMessage(message._id);
              }}
              className={`
                flex items-start gap-3 p-3 cursor-pointer transition-colors
                ${index === currentIndex ? 'bg-primary/10' : 'hover:bg-muted'}
              `}
            >
              <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">
                    {message.sender?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {highlightText(message.content, query)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && results.length === 0 && !loading && (
        <div className="p-6 text-center text-muted-foreground border-t">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No messages found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default MessageSearch;