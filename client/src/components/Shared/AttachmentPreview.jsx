import { useState } from 'react';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  File, 
  Download,
  X,
  Maximize2
} from 'lucide-react';
import { Button } from '@components/ui/button';
import { Dialog, DialogContent } from '@components/ui/dialog';

const AttachmentPreview = ({ attachments, onRemove, editable = false }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <File className="h-6 w-6" />;
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6" />;
    if (mimeType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <FileText className="h-6 w-6 text-green-500" />;
    }
    return <FileText className="h-6 w-6" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleImageClick = (attachment) => {
    setLightboxImage(attachment.url);
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

  const isImage = (attachment) => {
    return attachment.mimeType?.startsWith('image/') || 
           attachment.type?.startsWith('image/');
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="relative group"
          >
            {isImage(attachment) ? (
              // Image attachment
              <div 
                className="relative cursor-pointer"
                onClick={() => handleImageClick(attachment)}
              >
                <img
                  src={attachment.url || attachment.preview}
                  alt={attachment.originalName || attachment.name}
                  className="max-w-xs max-h-48 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ) : (
              // File attachment
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg min-w-[200px]">
                <div className="p-2 bg-background rounded">
                  {getFileIcon(attachment.mimeType || attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.originalName || attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(attachment.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(attachment)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Remove button (for editable mode) */}
            {editable && onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentPreview;