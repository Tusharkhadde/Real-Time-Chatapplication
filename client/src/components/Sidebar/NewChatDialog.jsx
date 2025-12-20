import { useState, useEffect } from 'react';
import { userAPI } from '@services/api';
import { useChat } from '@context/ChatContext';
import { useSocket } from '@context/SocketContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Search, Loader2, UserPlus, MessageSquare } from 'lucide-react';

const NewChatDialog = ({ open, onOpenChange, onSelect }) => {
  const { createPrivateConversation } = useChat();
  const { isUserOnline } = useSocket();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setUsers([]);
    }
  }, [open]);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const response = await userAPI.searchUsers(search);
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSelectUser = async (userId) => {
    try {
      setCreating(userId);
      const conversation = await createPrivateConversation(userId);
      onSelect(conversation);
    } catch (err) {
      console.error('Create conversation error:', err);
    } finally {
      setCreating(null);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '??';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Searching...</p>
              </div>
            )}

            {!loading && search.length >= 2 && users.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <UserPlus className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No users found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Try a different search term
                </p>
              </div>
            )}

            {!loading && search.length < 2 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Find people to chat with</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Type at least 2 characters to search
                </p>
              </div>
            )}

            {!loading && users.length > 0 && (
              <div className="space-y-1">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectUser(user._id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      {isUserOnline(user._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.username}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={creating === user._id}
                      className="flex-shrink-0"
                    >
                      {creating === user._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;