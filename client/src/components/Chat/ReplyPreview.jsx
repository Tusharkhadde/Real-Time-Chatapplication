import { X, Reply, Image, FileText, Mic } from 'lucide-react';

const ReplyPreview = ({ message, onCancel }) => {
  if (!message) return null;

  const getPreviewContent = () => {
    if (message.type === 'image' || message.attachments?.some(a => a.mimeType?.startsWith('image/'))) {
      return (
        <span className="flex items-center gap-1">
          <Image className="h-3 w-3" />
          Photo
        </span>
      );
    }
    if (message.type === 'audio' || message.attachments?.some(a => a.mimeType?.startsWith('audio/'))) {
      return (
        <span className="flex items-center gap-1">
          <Mic className="h-3 w-3" />
          Voice message
        </span>
      );
    }
    if (message.type === 'file' || message.attachments?.length > 0) {
      return (
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          File
        </span>
      );
    }
    return message.content?.substring(0, 100) || 'Message';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-t-xl border-l-4 border-primary">
      <Reply className="h-4 w-4 text-primary flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          Replying to {message.sender?.username || 'Unknown'}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {getPreviewContent()}
        </p>
      </div>

      <button
        onClick={onCancel}
        className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default ReplyPreview;