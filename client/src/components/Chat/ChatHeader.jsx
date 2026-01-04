import { useState } from "react";
import { useChat } from "@context/ChatContext";
import { useSocket } from "@context/SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import ChatInfoDialog from "./ChatInfoDialog";

import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

import {
  ArrowLeft,
  Search,
  Phone,
  Video,
  MoreVertical,
  Users,
  Bell,
  Trash2,
  Info,
  UserPlus,
  LogOut,
} from "lucide-react";

import GroupInfoDialog from "./GroupInfoDialog";

const ChatHeader = ({ onBack, onSearchClick }) => {
  const { activeConversation, getOtherParticipant } = useChat();
  const { isUserOnline } = useSocket();

  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === "group";

  let displayName, displayAvatar, isOnline, statusText;

  if (isGroup) {
    displayName = activeConversation.groupInfo?.name || "Group Chat";
    displayAvatar = activeConversation.groupInfo?.avatar;
    isOnline = false;
    statusText = `${activeConversation.participants?.length || 0} members`;
  } else {
    const otherUser = getOtherParticipant(activeConversation);
    displayName = otherUser?.username || "Unknown User";
    displayAvatar = otherUser?.avatar;
    isOnline = otherUser ? isUserOnline(otherUser._id) : false;
    statusText = isOnline ? otherUser?.statusMessage || "Online" : "Offline";
  }

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "??";

  return (
    <>
      <header className="flex-shrink-0 flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar + Info */}
          <div
            className="flex items-center gap-3 min-w-0 cursor-pointer"
            onClick={() => setInfoOpen(true)}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayAvatar} />
                <AvatarFallback
                  className={isGroup ? "bg-purple-500 text-white" : ""}
                >
                  {isGroup ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    getInitials(displayName)
                  )}
                </AvatarFallback>
              </Avatar>

              {!isGroup && isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-semibold truncate">{displayName}</h2>
              <p
                className={`text-sm truncate ${
                  isOnline ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                {statusText}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            onClick={onSearchClick}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Phone className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Video className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onSearchClick} className="sm:hidden">
                <Search className="h-4 w-4 mr-2" />
                Search
              </DropdownMenuItem>

              {isGroup && (
                <>
                  <DropdownMenuItem onClick={() => setShowGroupInfo(true)}>
                    <Info className="h-4 w-4 mr-2" />
                    Group info
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add members
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem>
                <Bell className="h-4 w-4 mr-2" />
                Mute notifications
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isGroup ? (
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave group
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete chat
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ✅ Chat Info Dialog */}
      <ChatInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        conversation={activeConversation}
      />

      {/* Group Info Dialog */}
      {isGroup && (
        <GroupInfoDialog
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          conversation={activeConversation}
        />
      )}
    </>
  );
};

export default ChatHeader;