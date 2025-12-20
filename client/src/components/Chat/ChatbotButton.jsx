import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { chatbotAPI } from '@services/api';
import { Avatar, AvatarFallback } from '@components/ui/avatar';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "Hi! I'm your AI assistant. How can I help you today? 🤖",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date()
    }]);

    setLoading(true);
    try {
      const response = await chatbotAPI.sendMessage(userMessage);
      if (response.data.success) {
        setMessages(prev => [
          ...prev,
          { 
            role: 'bot', 
            content: response.data.data.botResponse,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [
        ...prev,
        { 
          role: 'bot', 
          content: "Sorry, I couldn't process that. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'bot',
      content: "Chat cleared! How can I help you? 🤖",
      timestamp: new Date()
    }]);
  };

  const quickActions = [
    { label: '👋 Hi', message: 'Hello!' },
    { label: '😂 Joke', message: 'Tell me a joke' },
    { label: '📚 Fact', message: 'Tell me a fact' },
    { label: '⏰ Time', message: "What's the time?" }
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg
          transition-all duration-300 transform
          ${isOpen 
            ? 'bg-muted text-foreground rotate-0 scale-90' 
            : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white hover:scale-110 hover:shadow-xl'
          }
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[350px] bg-background border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs opacity-80">Always here to help</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={clearChat}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-2 border-b flex gap-2 overflow-x-auto no-scrollbar">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(action.message);
                  setTimeout(handleSend, 100);
                }}
                className="px-3 py-1.5 text-xs bg-muted rounded-full whitespace-nowrap hover:bg-muted/80 transition-colors flex-shrink-0"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {message.role === 'bot' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`
                    max-w-[80%] px-4 py-2 rounded-2xl text-sm
                    ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                    }
                  `}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={loading}
                className="bg-muted border-0"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotButton;