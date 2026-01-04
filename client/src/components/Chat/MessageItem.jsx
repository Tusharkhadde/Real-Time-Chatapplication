import { useState, memo, useCallback, useMemo, useRef } from "react";
import { useChat } from "@context/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { formatTime } from "@utils/formatters";
import {
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Copy,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  File,
  Forward,
  Loader2,
} from "lucide-react";
import VoiceMessage from "./VoiceMessage";
import LinkPreview, { extractUrls } from "./LinkPreview";

const MessageItem = memo(
  ({ message, isOwn, showAvatar, isLastInGroup, onReply }) => {
    const {
      addReaction,
      deleteMessage,
      conversations,
      forwardMessage,
      activeConversation,
    } = useChat();

    // State
    const [showActions, setShowActions] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [forwardOpen, setForwardOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardError, setForwardError] = useState(null);

    // Long press handling
    const pressTimerRef = useRef(null);

    const startPressTimer = useCallback(() => {
      pressTimerRef.current = setTimeout(() => {
        setShowActions(true);
      }, 450);
    }, []);

    const cancelPressTimer = useCallback(() => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }, []);

    // Memoized values
    const groupedReactions = useMemo(() => {
      const reactions = message?.reactions || [];
      return reactions.reduce((acc, r) => {
        if (!r?.emoji) return acc;
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {});
    }, [message?.reactions]);

    const isSystem = message?.type === "system";
    const isDeleted = message?.isDeleted;
    const hasAttachments = useMemo(
      () => (message?.attachments?.length || 0) > 0,
      [message?.attachments]
    );

    const urls = useMemo(
      () => (message?.content ? extractUrls(message.content) : []),
      [message?.content]
    );

    // Filter available chats for forwarding
    const availableChats = useMemo(() => {
      if (!conversations || !activeConversation) return [];
      return conversations.filter(
        (chat) => chat._id !== activeConversation._id
      );
    }, [conversations, activeConversation]);

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    // Helper functions
    const getInitials = useCallback(
      (name) =>
        name
          ?.split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .substring(0, 2) || "??",
      []
    );

    const handleCopy = useCallback(() => {
      if (message?.content) {
        navigator.clipboard.writeText(message.content);
      }
    }, [message?.content]);

    const getFileIcon = useCallback((mimeType) => {
      if (!mimeType) return <File className="h-5 w-5" />;
      if (mimeType.startsWith("image/"))
        return <ImageIcon className="h-5 w-5" />;
      if (mimeType.startsWith("video/")) return <Video className="h-5 w-5" />;
      if (mimeType.startsWith("audio/")) return <Mic className="h-5 w-5" />;
      return <FileText className="h-5 w-5" />;
    }, []);

    const handleDelete = useCallback(async () => {
      if (window.confirm("Delete this message?")) {
        await deleteMessage(message._id);
      }
    }, [deleteMessage, message?._id]);

    const handleOpenForward = useCallback(() => {
      setForwardError(null);
      setSelectedChat(null);
      setForwardOpen(true);
    }, []);

    const handleCloseForward = useCallback(() => {
      setForwardOpen(false);
      setSelectedChat(null);
      setForwardError(null);
    }, []);

    const handleForwardSubmit = useCallback(async () => {
      if (!selectedChat || !message?._id) return;

      setIsForwarding(true);
      setForwardError(null);

      try {
        await forwardMessage(message._id, selectedChat._id);
        handleCloseForward();
      } catch (err) {
        console.error("Forward failed:", err);
        setForwardError(err.message || "Failed to forward message");
      } finally {
        setIsForwarding(false);
      }
    }, [selectedChat, message?._id, forwardMessage, handleCloseForward]);

    const handleImageClick = useCallback((url) => {
      setLightboxImage(url);
      setLightboxOpen(true);
    }, []);

    const handleDownload = useCallback((attachment) => {
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download =
        attachment.originalName || attachment.filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, []);

    const formatSize = useCallback((bytes) => {
      if (!bytes) return "";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }, []);

    const stopPropagation = useCallback((e) => e.stopPropagation(), []);

    // Get chat display info for forward dialog
    const getChatDisplayInfo = useCallback((chat) => {
      if (chat.type === "group" || chat.isGroup) {
        return {
          name: chat.name || "Group",
          subtitle: `${chat.participants?.length || 0} members`,
          avatar: chat.avatar,
        };
      }

      const otherParticipant = chat.participants?.find(
        (p) => p.user?._id !== message?.sender?._id
      )?.user;

      return {
        name: otherParticipant?.username || chat.name || "Chat",
        subtitle: "Direct message",
        avatar: otherParticipant?.avatar || chat.avatar,
      };
    }, [message?.sender?._id]);

    // Render system message
    if (isSystem) {
      return (
        <div 
          id={`message-${message._id}`}
          className="flex items-center justify-center my-3"
        >
          <div className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground max-w-[80%] text-center">
            {message?.content}
          </div>
        </div>
      );
    }

    return (
      <>
        {/* ✅ ADDED: id attribute for scrollToMessage */}
        <div
          id={`message-${message._id}`}
          className={`group flex gap-2 px-2 py-0.5 transition-all duration-300 rounded-lg ${
            isOwn ? "flex-row-reverse" : ""
          }`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          onTouchStart={startPressTimer}
          onTouchEnd={cancelPressTimer}
          onTouchMove={cancelPressTimer}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowActions(true);
          }}
        >
          {/* Avatar */}
          <div className="w-8 flex-shrink-0">
            {showAvatar && !isOwn && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message?.sender?.avatar} />
                <AvatarFallback className="text-xs bg-primary/10">
                  {getInitials(message?.sender?.username)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Message Content */}
          <div
            className={`flex flex-col max-w-[70%] ${
              isOwn ? "items-end" : "items-start"
            }`}
          >
            {/* Sender name */}
            {showAvatar && !isOwn && (
              <span className="text-xs text-muted-foreground mb-1 ml-1">
                {message?.sender?.username}
              </span>
            )}

            {/* Forwarded indicator */}
            {message?.forwarded && (
              <div className={`
                flex items-center gap-1 text-xs text-muted-foreground mb-1
                ${isOwn ? "flex-row-reverse" : ""}
              `}>
                <Forward className="h-3 w-3" />
                <span>
                  Forwarded
                  {message.originalSender?.username && (
                    <span className="font-normal">
                      {" from "}{message.originalSender.username}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Reply preview */}
            {message?.replyTo && (
              <div
                className={`
                  flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg text-xs
                  ${isOwn ? "bg-primary/20" : "bg-muted"}
                  border-l-2 border-primary
                `}
              >
                <Reply className="h-3 w-3 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium">
                    {message.replyTo.sender?.username}
                  </span>
                  <p className="truncate text-muted-foreground">
                    {message.replyTo.content}
                  </p>
                </div>
              </div>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="space-y-1 mb-1">
                {message.attachments.map((attachment, index) => {
                  const isImage = attachment.mimeType?.startsWith("image/");
                  const isAudio = attachment.mimeType?.startsWith("audio/");

                  if (isImage) {
                    return (
                      <div
                        key={index}
                        className="cursor-pointer rounded-2xl overflow-hidden"
                        onClick={() => handleImageClick(attachment.url)}
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.originalName}
                          className="max-w-full max-h-64 object-cover hover:opacity-90 transition-opacity"
                          loading="lazy"
                        />
                      </div>
                    );
                  }

                  if (isAudio) {
                    return (
                      <div
                        key={index}
                        className={`
                          px-4 py-3 rounded-2xl
                          ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}
                        `}
                      >
                        <VoiceMessage
                          url={attachment.url}
                          duration={attachment.duration}
                          isOwn={isOwn}
                        />
                      </div>
                    );
                  }

                  // File attachment
                  return (
                    <div
                      key={index}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px]
                        ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}
                      `}
                    >
                      <div
                        className={`
                          p-2 rounded-lg
                          ${isOwn ? "bg-primary-foreground/20" : "bg-background"}
                        `}
                      >
                        {getFileIcon(attachment.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.originalName || attachment.filename}
                        </p>
                        <p
                          className={`text-xs ${
                            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatSize(attachment.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 flex-shrink-0 ${
                          isOwn ? "text-primary-foreground hover:bg-primary-foreground/20" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(attachment);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Text content */}
            {message?.content && message?.type !== "audio" && (
              <div
                className={`
                  relative px-4 py-2 rounded-2xl message-enter
                  ${isOwn
                    ? `bg-primary text-primary-foreground ${isLastInGroup ? "rounded-br-md" : ""}`
                    : `bg-muted ${isLastInGroup ? "rounded-bl-md" : ""}`
                  }
                  ${isDeleted ? "bg-muted/60 text-muted-foreground border border-border/40" : ""}
                `}
              >
                {isDeleted ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="text-sm italic">
                      This message was deleted
                    </span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
              </div>
            )}

            {/* Link preview */}
            {!isDeleted && urls.length > 0 && (
              <div className="mt-1 max-w-full">
                <LinkPreview url={urls[0]} />
              </div>
            )}

            {/* Message meta */}
            <div
              className={`flex items-center gap-1 mt-1 px-1 ${
                isOwn ? "flex-row-reverse" : ""
              }`}
            >
              <span className="text-[10px] text-muted-foreground">
                {formatTime(message?.createdAt)}
              </span>
              {message?.isEdited && (
                <span className="text-[10px] text-muted-foreground">
                  • edited
                </span>
              )}
              {isOwn && !isDeleted && (
                <span className="flex items-center">
                  {message?.readBy?.length > 1 ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
              )}
            </div>

            {/* Reactions */}
            {Object.keys(groupedReactions).length > 0 && (
              <div
                className={`flex flex-wrap gap-1 mt-1 ${
                  isOwn ? "justify-end" : ""
                }`}
              >
                {Object.entries(groupedReactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    className="flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full transition-colors"
                    onClick={() => addReaction(message._id, emoji)}
                  >
                    <span>{emoji}</span>
                    {count > 1 && (
                      <span className="text-muted-foreground">{count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div
            className={`
              flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
              ${isOwn ? "order-first" : ""}
            `}
          >
            {!isDeleted && (
              <>
                {/* Quick reactions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={stopPropagation}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <span className="text-sm">😀</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    className="grid grid-cols-6 gap-1 p-2"
                  >
                    {quickReactions.map((emoji) => (
                      <DropdownMenuItem
                        key={emoji}
                        className="flex items-center justify-center text-lg cursor-pointer"
                        onClick={() => addReaction(message._id, emoji)}
                      >
                        {emoji}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={stopPropagation}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"}>
                    <DropdownMenuItem onClick={() => onReply?.(message)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenForward}>
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                    {message?.content && (
                      <DropdownMenuItem onClick={handleCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                    )}
                    {isOwn && (
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Image Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-none shadow-none">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg mx-auto"
            />
          </DialogContent>
        </Dialog>

        {/* Forward Dialog */}
        <Dialog open={forwardOpen} onOpenChange={setForwardOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Forward message</DialogTitle>
              <DialogDescription>
                Select a chat where you want to forward this message.
              </DialogDescription>
            </DialogHeader>

            {forwardError && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
                {forwardError}
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto py-2">
              {availableChats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No other chats available to forward to.
                </p>
              ) : (
                availableChats.map((chat) => {
                  const displayInfo = getChatDisplayInfo(chat);

                  return (
                    <div
                      key={chat._id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChat?._id === chat._id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={displayInfo.avatar} />
                        <AvatarFallback>
                          {displayInfo.name?.charAt(0)?.toUpperCase() || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {displayInfo.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {displayInfo.subtitle}
                        </p>
                      </div>
                      {selectedChat?._id === chat._id && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={handleCloseForward}
                disabled={isForwarding}
              >
                Cancel
              </Button>
              <Button
                disabled={!selectedChat || isForwarding}
                onClick={handleForwardSubmit}
              >
                {isForwarding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Forwarding...
                  </>
                ) : (
                  "Forward"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

MessageItem.displayName = "MessageItem";

export default MessageItem;