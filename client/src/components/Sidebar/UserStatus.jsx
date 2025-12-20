import { useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Settings } from 'lucide-react';
import { Button } from '@components/ui/button';

const UserStatus = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex items-center gap-3">
      <div 
        className="relative cursor-pointer"
        onClick={() => navigate('/profile')}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.username}</p>
        <p className="text-sm text-muted-foreground truncate">
          {user.statusMessage || user.email}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate('/profile')}
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default UserStatus;