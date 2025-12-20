import { useState, memo } from 'react';
import { useChat } from '@context/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@components/ui/dialog';
import { formatTime } from '@utils/formatters';
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
  Play,
  Pause
} from 'lucide-react';
import VoiceMessage from './VoiceMessage';
import LinkPreview, { extractUrls } from './LinkPreview';

const MessageItem = memo(({ 
  message, 
  isOwn, 
  showAvatar, 
  isLastInGroup,
  onReply 
}) => {
  const { addReaction, deleteMessage } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const isSystem = message.type === 'system';
  const isDeleted = message.isDeleted;
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const urls = message.content ? extractUrls(message.content) : [];

  // System message
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3">
        <div className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs text-muted-foreground max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message?')) {
      await deleteMessage(message._id);
    }
  };

  const handleImageClick = (url) => {
    setLightboxImage(url);
    setLightboxOpen(true);
  };

  const handleDownload = (attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName || attachment.filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="h-5 w-5" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimeType.startsWith('audio/')) return <Mic className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <>
      <div
        className={`group flex gap-2 px-2 py-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar */}
        <div className="w-8 flex-shrink-0">
          {showAvatar && !isOwn && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender?.avatar} />
              <AvatarFallback className="text-xs bg-primary/10">
                {getInitials(message.sender?.username)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Sender name (for group chats, first message in group) */}
          {showAvatar && !isOwn && (
            <span className="text-xs text-muted-foreground mb-1 ml-1">
              {message.sender?.username}
            </span>
          )}

          {/* Reply preview */}
          {message.replyTo && (
            <div className={`
              flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg text-xs
              ${isOwn ? 'bg-primary/20' : 'bg-muted'}
              border-l-2 border-primary
            `}>
              <Reply className="h-3 w-3 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium">{message.replyTo.sender?.username}</span>
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
                const isImage = attachment.mimeType?.startsWith('image/');
                const isAudio = attachment.mimeType?.startsWith('audio/');
                
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
                    <div key={index} className={`
                      px-4 py-3 rounded-2xl
                      ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                    `}>
                      <VoiceMessage 
                        url={attachment.url} 
                        duration={attachment.duration}
                        isOwn={isOwn}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={index}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[200px]
                      ${isOwn 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg
                      ${isOwn ? 'bg-primary-foreground/20' : 'bg-background'}
                    `}>
                      {getFileIcon(attachment.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.originalName || attachment.filename}
                      </p>
                      <p className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatSize(attachment.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 flex-shrink-0 ${
                        isOwn ? 'text-primary-foreground hover:bg-primary-foreground/20' : ''
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
          {message.content && message.type !== 'audio' && (
            <div
              className={`
                relative px-4 py-2 rounded-2xl message-enter
                ${isOwn 
                  ? `bg-primary text-primary-foreground ${isLastInGroup ? 'rounded-br-md' : ''}` 
                  : `bg-muted ${isLastInGroup ? 'rounded-bl-md' : ''}`
                }
                ${isDeleted ? 'italic opacity-60' : ''}
              `}
            >
              {isDeleted ? (
                <p className="text-sm">This message was deleted</p>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {/* Link Preview */}
          {!isDeleted && urls.length > 0 && (
            <div className="mt-1 max-w-full">
              <LinkPreview url={urls[0]} />
            </div>
          )}

          {/* Time and status */}
          <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {message.isEdited && (
              <span className="text-[10px] text-muted-foreground">• edited</span>
            )}
            {isOwn && !isDeleted && (
              <span className="flex items-center">
                {message.readBy?.length > 1 ? (
                  <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions?.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <button 
                  key={emoji}
                  className="flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full transition-colors"
                  onClick={() => addReaction(message._id, emoji)}
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-muted-foreground">{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`
          flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
          ${isOwn ? 'order-first' : ''}
        `}>
          {!isDeleted && (
            <>
              {/* Quick reactions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <span className="text-sm">😀</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="flex gap-1 p-1 min-w-0">
                  {quickReactions.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => addReaction(message._id, emoji)}
                      className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  {message.content && (
                    <DropdownMenuItem onClick={handleCopy}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
    </>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;