import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@context/ChatContext';
import { uploadAPI } from '@services/api';
import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X, 
  Image, 
  FileText, 
  Loader2,
  Mic,
  Camera
} from 'lucide-react';
import EmojiPicker from '@components/Shared/EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import ReplyPreview from './ReplyPreview';

const MessageInput = ({ replyTo, onCancelReply }) => {
  const { sendMessage, startTyping, stopTyping, activeConversation } = useChat();
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [content]);

  // Handle typing indicator
  useEffect(() => {
    if (content && !isTyping) {
      setIsTyping(true);
      startTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, isTyping, startTyping, stopTyping]);

  // Reset when conversation changes
  useEffect(() => {
    setContent('');
    setAttachments([]);
    setIsTyping(false);
    setShowEmojiPicker(false);
    setShowVoiceRecorder(false);
    onCancelReply?.();
  }, [activeConversation?._id]);

  // Focus input when reply is set
  useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const uploadAttachments = async () => {
    if (attachments.length === 0) return [];

    setUploading(true);
    try {
      const formData = new FormData();
      attachments.forEach(attachment => {
        formData.append('files', attachment.file);
      });

      const response = await uploadAPI.uploadFiles(formData);
      return response.data.success ? response.data.data : [];
    } catch (err) {
      console.error('Upload error:', err);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleVoiceSend = async (audioFile, duration) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('files', audioFile);
      
      const response = await uploadAPI.uploadFiles(formData);
      
      if (response.data.success) {
        const attachment = response.data.data[0];
        await sendMessage('🎤 Voice message', 'audio', [{
          ...attachment,
          duration
        }], replyTo?._id);
        
        onCancelReply?.();
      }
    } catch (err) {
      console.error('Voice send error:', err);
    } finally {
      setUploading(false);
      setShowVoiceRecorder(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const hasContent = content.trim();
    const hasAttachments = attachments.length > 0;

    if (!hasContent && !hasAttachments) return;

    try {
      let uploadedFiles = [];
      
      if (hasAttachments) {
        uploadedFiles = await uploadAttachments();
      }

      let messageType = 'text';
      if (uploadedFiles.length > 0) {
        const firstFile = uploadedFiles[0];
        if (firstFile.mimeType?.startsWith('image/')) messageType = 'image';
        else if (firstFile.mimeType?.startsWith('video/')) messageType = 'video';
        else if (firstFile.mimeType?.startsWith('audio/')) messageType = 'audio';
        else messageType = 'file';
      }

      const attachmentsData = uploadedFiles.map(f => ({
        filename: f.filename,
        originalName: f.originalName || f.name,
        mimeType: f.mimeType || f.type,
        size: f.size,
        url: f.url
      }));

      await sendMessage(
        hasContent ? content.trim() : '',
        messageType,
        attachmentsData.length > 0 ? attachmentsData : null,
        replyTo?._id
      );

      setContent('');
      setAttachments([]);
      setIsTyping(false);
      stopTyping();
      onCancelReply?.();
      textareaRef.current?.focus();

    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (showVoiceRecorder) {
    return (
      <div className="border-t bg-background p-4">
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      </div>
    );
  }

  return (
    <div className="border-t bg-background">
      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview message={replyTo} onCancel={onCancelReply} />
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group"
              >
                {attachment.preview ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="max-w-[120px]">
                      <p className="text-xs font-medium truncate">{attachment.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(attachment.size)}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>

          {/* Text input container */}
          <div className="flex-1 relative bg-muted rounded-2xl">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent pr-12 py-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
              disabled={uploading}
            />
            
            {/* Emoji button */}
            <div className="absolute right-2 bottom-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <EmojiPicker 
                    onSelect={handleEmojiSelect} 
                    onClose={() => setShowEmojiPicker(false)} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* Send / Voice button */}
          {content.trim() || attachments.length > 0 ? (
            <Button 
              type="submit" 
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          ) : (
            <Button 
              type="button" 
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full flex-shrink-0"
              onClick={() => setShowVoiceRecorder(true)}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default MessageInput;