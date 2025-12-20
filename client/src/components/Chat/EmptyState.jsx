import { MessageCircle, Users, Sparkles } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
      <div className="text-center max-w-md">
        {/* Animated illustration */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="p-6 bg-gradient-to-br from-primary to-purple-600 rounded-3xl shadow-lg transform rotate-3">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3">Welcome to ChatApp</h2>
        
        <p className="text-muted-foreground mb-8">
          Select a conversation from the sidebar or start a new chat to begin messaging. 
          Connect with friends, family, and colleagues in real-time.
        </p>

        {/* Features highlight */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-background rounded-xl border">
            <MessageCircle className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">Messages</p>
            <p className="text-xs text-muted-foreground">Instant delivery</p>
          </div>
          <div className="p-4 bg-background rounded-xl border">
            <Users className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">Groups</p>
            <p className="text-xs text-muted-foreground">Team chats</p>
          </div>
          <div className="p-4 bg-background rounded-xl border">
            <Sparkles className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">AI Bot</p>
            <p className="text-xs text-muted-foreground">Smart assistant</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;