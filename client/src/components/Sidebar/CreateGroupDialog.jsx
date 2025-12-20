import { useState, useEffect } from 'react';
import { userAPI } from '@services/api';
import { useChat } from '@context/ChatContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@components/ui/dialog';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { 
  Search, 
  Loader2, 
  Users, 
  X, 
  Check,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const CreateGroupDialog = ({ open, onOpenChange, onCreated }) => {
  const { createGroupConversation } = useChat();
  
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setGroupName('');
      setSearch('');
      setUsers([]);
      setSelectedUsers([]);
    }
  }, [open]);

  // Search users
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
          // Filter out already selected users
          const filtered = response.data.data.filter(
            u => !selectedUsers.find(s => s._id === u._id)
          );
          setUsers(filtered);
        }
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, selectedUsers]);

  const handleSelectUser = (user) => {
    setSelectedUsers(prev => [...prev, user]);
    setSearch('');
    setUsers([]);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      setCreating(true);
      const conversation = await createGroupConversation(
        groupName.trim(),
        selectedUsers.map(u => u._id)
      );
      onCreated(conversation);
    } catch (err) {
      console.error('Create group error:', err);
    } finally {
      setCreating(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {step === 1 ? 'Create Group' : 'Add Members'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Group name
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                autoFocus
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Choose a name for your group chat. You can change it later.
            </p>
          </div>
        ) : (
          // Step 2: Add members
          <div className="space-y-4 py-4">
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-1 px-2 py-1 bg-background rounded-full text-sm"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate">{user.username}</span>
                    <button
                      onClick={() => handleRemoveUser(user._id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search results */}
            <div className="max-h-[200px] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && search.length >= 2 && users.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No users found
                </p>
              )}

              {!loading && search.length < 2 && selectedUsers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Search for users to add to the group
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2">
          {step === 2 && (
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex-1" />
          
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!groupName.trim()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={selectedUsers.length === 0 || creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Create Group ({selectedUsers.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;