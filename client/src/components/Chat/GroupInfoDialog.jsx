import { useState } from 'react';
import { useChat } from '@context/ChatContext';
import { useAuth } from '@context/AuthContext';
import { useSocket } from '@context/SocketContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { 
  Users, 
  Edit2, 
  Check, 
  X, 
  Crown, 
  UserMinus,
  LogOut,
  Loader2
} from 'lucide-react';

const GroupInfoDialog = ({ open, onOpenChange, conversation }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(conversation?.groupInfo?.name || '');
  const [loading, setLoading] = useState(false);

  if (!conversation) return null;

  const isAdmin = conversation.participants?.some(
    p => p.user?._id === user?._id && p.role === 'admin'
  );

  const getInitials = (name) => {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  const handleSave = async () => {
    if (!groupName.trim()) return;
    
    setLoading(true);
    try {
      // API call to update group name would go here
      setIsEditing(false);
    } catch (err) {
      console.error('Update group error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Info</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={conversation.groupInfo?.avatar} />
              <AvatarFallback className="bg-purple-500 text-white text-2xl">
                <Users className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>

            {isEditing ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-center"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSave} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{conversation.groupInfo?.name}</h3>
                {isAdmin && (
                  <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-1">
              {conversation.participants?.length} members
            </p>
          </div>

          {/* Description */}
          {conversation.groupInfo?.description && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {conversation.groupInfo.description}
              </p>
            </div>
          )}

          {/* Members */}
          <div>
            <h4 className="text-sm font-medium mb-3">Members</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversation.participants?.map((participant) => {
                const member = participant.user;
                const isCurrentUser = member?._id === user?._id;
                const isMemberAdmin = participant.role === 'admin';
                const online = isUserOnline(member?._id);

                return (
                  <div
                    key={member?._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member?.avatar} />
                        <AvatarFallback>{getInitials(member?.username)}</AvatarFallback>
                      </Avatar>
                      {online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {member?.username}
                          {isCurrentUser && ' (You)'}
                        </span>
                        {isMemberAdmin && (
                          <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member?.email}
                      </p>
                    </div>

                    {isAdmin && !isCurrentUser && (
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave Group */}
          <Button variant="destructive" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;