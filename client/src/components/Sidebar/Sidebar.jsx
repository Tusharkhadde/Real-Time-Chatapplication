import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useChat } from '@context/ChatContext';
import { useTheme } from '@context/ThemeContext';
import ConversationList from './ConversationList';
import NewChatDialog from './NewChatDialog';
import CreateGroupDialog from './CreateGroupDialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { 
  MessageSquarePlus, 
  Users,
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Search,
  X,
  MoreVertical,
  User,
  Bell
} from 'lucide-react';

const Sidebar = ({ onSelectConversation }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { conversations, totalUnreadCount, activeConversation } = useChat();
  const { theme, setTheme, isDark } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => {
      if (conv.type === 'group') {
        return conv.groupInfo?.name?.toLowerCase().includes(query);
      }
      const other = conv.participants?.find(p => p.user?._id !== user?._id);
      return other?.user?.username?.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="relative cursor-pointer group"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.username)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold truncate">{user?.username}</h2>
              <p className="text-xs text-muted-foreground truncate">
                {user?.statusMessage || 'Online'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-muted/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Action Buttons */}
      <div className="flex-shrink-0 p-3 border-b flex gap-2">
        <Button 
          className="flex-1"
          onClick={() => setShowNewChat(true)}
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={() => setShowCreateGroup(true)}
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <ConversationList 
            conversations={filteredConversations}
            activeId={activeConversation?._id}
            onSelect={onSelectConversation}
          />
        ) : searchQuery ? (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No conversations found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <MessageSquarePlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Start a new chat to get going
            </p>
            <Button 
              className="mt-4"
              onClick={() => setShowNewChat(true)}
            >
              Start Chatting
            </Button>
          </div>
        )}
      </div>

      {/* Unread badge at bottom */}
      {totalUnreadCount > 0 && (
        <div className="flex-shrink-0 p-3 border-t bg-primary/5">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">
              {totalUnreadCount} unread message{totalUnreadCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <NewChatDialog 
        open={showNewChat} 
        onOpenChange={setShowNewChat}
        onSelect={(conv) => {
          setShowNewChat(false);
          onSelectConversation(conv);
        }}
      />

      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onCreated={(conv) => {
          setShowCreateGroup(false);
          onSelectConversation(conv);
        }}
      />
    </div>
  );
};

export default Sidebar;