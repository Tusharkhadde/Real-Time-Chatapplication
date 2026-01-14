import { useState, useRef, useEffect } from 'react';
import { useChat } from '@context/ChatContext';
import { uploadAPI } from '@services/api';

import { Button } from '@components/ui/button';
import { Textarea } from '@components/ui/textarea';

import { 
  Send, 
  Smile, 
  X, 
  FileText, 
  Loader2,
  Mic
} from 'lucide-react';

import EmojiPicker from '@components/Shared/EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import ReplyPreview from './ReplyPreview';
import CreatePollDialog from './CreatePollDialog';
import AttachmentMenu from './AttachmentMenu';


const MessageInput = ({ replyTo, onCancelReply }) => {

  const { sendMessage, startTyping, stopTyping, activeConversation } = useChat();

  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const [showPollDialog, setShowPollDialog] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);


  // -----------------------------
  // AUTO-RESIZE TEXTAREA
  // -----------------------------
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';

  }, [content]);


  // -----------------------------
  // TYPING INDICATOR
  // -----------------------------
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

    return () => typingTimeoutRef.current && clearTimeout(typingTimeoutRef.current);

  }, [content, isTyping, startTyping, stopTyping]);


  // -----------------------------
  // RESET ON CONVERSATION SWITCH
  // -----------------------------
  useEffect(() => {
    setContent('');
    setAttachments([]);
    setIsTyping(false);
    setShowEmojiPicker(false);
    setShowVoiceRecorder(false);
    setShowPollDialog(false);
    onCancelReply?.();
  }, [activeConversation?._id]);


  // -----------------------------
  // FILE ATTACHMENT HANDLING
  // -----------------------------
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxSize = 10 * 1024 * 1024;

    const valid = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 10MB).`);
        return false;
      }
      return true;
    });

    const mapped = valid.map(file => ({
      file,
      preview: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setAttachments(prev => [...prev, ...mapped]);

    // Reset all file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mediaInputRef.current) mediaInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
  };


  const removeAttachment = (index) => {
    setAttachments(prev => {
      const copy = [...prev];
      if (copy[index].preview) URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };


  const uploadAttachments = async () => {
    if (!attachments.length) return [];

    setUploading(true);

    try {
      const form = new FormData();
      attachments.forEach(a => form.append('files', a.file));

      const res = await uploadAPI.uploadFiles(form);
      return res.data.success ? res.data.data : [];

    } catch (err) {
      console.error('Upload error:', err);
      return [];

    } finally {
      setUploading(false);
    }
  };


  // -----------------------------
  // VOICE MESSAGE SEND
  // -----------------------------
  const handleVoiceSend = async (audioFile, duration) => {
    try {
      setUploading(true);

      const form = new FormData();
      form.append('files', audioFile);

      const res = await uploadAPI.uploadFiles(form);

      if (res.data.success) {
        const att = res.data.data[0];

        await sendMessage(
          '🎤 Voice message',
          'audio',
          [{ ...att, duration }],
          replyTo?._id
        );

        onCancelReply?.();
      }

    } catch (err) {
      console.error('Voice send error:', err);

    } finally {
      setUploading(false);
      setShowVoiceRecorder(false);
    }
  };


  // -----------------------------
  // POLL SUBMIT
  // -----------------------------
  const handlePollSubmit = async (pollData) => {
    if (!activeConversation?._id) {
      console.error('No active conversation');
      return;
    }

    try {
      const messagePayload = {
        conversationId: activeConversation._id,
        type: 'poll',
        content: pollData.question,
        poll: {
          question: pollData.question,
          options: pollData.options.map((opt, idx) => ({
            id: opt.id || idx + 1,
            text: opt.text
          })),
          allowMultiple: pollData.allowMultiple || false,
          isAnonymous: pollData.isAnonymous || false
        }
      };

      await sendMessage(messagePayload);
      setShowPollDialog(false);

    } catch (error) {
      console.error('Send poll error:', error);
      throw error;
    }
  };


  // -----------------------------
  // NORMAL MESSAGE SEND
  // -----------------------------
  const handleSubmit = async (e) => {
    e?.preventDefault();

    const hasText = content.trim();
    const hasFiles = attachments.length > 0;

    if (!hasText && !hasFiles) return;

    try {
      let uploaded = [];

      if (hasFiles) uploaded = await uploadAttachments();

      let type = 'text';

      if (uploaded.length) {
        const f = uploaded[0];
        if (f.mimeType?.startsWith('image/')) type = 'image';
        else if (f.mimeType?.startsWith('video/')) type = 'video';
        else if (f.mimeType?.startsWith('audio/')) type = 'audio';
        else type = 'file';
      }

      const attData = uploaded.map(f => ({
        filename: f.filename,
        originalName: f.originalName || f.name,
        mimeType: f.mimeType || f.type,
        size: f.size,
        url: f.url
      }));

      await sendMessage(
        hasText ? content.trim() : '',
        type,
        attData.length ? attData : null,
        replyTo?._id || null
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
    const ta = textareaRef.current;

    if (!ta) {
      setContent(prev => prev + emoji);
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    const updated =
      content.substring(0, start) +
      emoji +
      content.substring(end);

    setContent(updated);

    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
      ta.focus();
    }, 0);

    setShowEmojiPicker(false);
  };


  const formatSize = (b) =>
    b < 1024 ? `${b} B`
      : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / (1024 * 1024)).toFixed(1)} MB`;


  // -----------------------------
  // ATTACHMENT MENU HANDLERS
  // -----------------------------
  const handleDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleMediaClick = () => {
    mediaInputRef.current?.click();
  };

  const handleAudioClick = () => {
    audioInputRef.current?.click();
  };

  const handleCameraClick = () => {
    // Future: Implement webcam capture
    alert('Camera capture coming soon! For now, please use the Photos & Videos option.');
  };

  const handleContactClick = () => {
    // Future: Implement contact sharing
    alert('Contact sharing coming soon!');
  };

  const handleEventClick = () => {
    // Future: Implement event creation
    alert('Event creation coming soon!');
  };

  const handleStickerClick = () => {
    // Future: Implement sticker picker
    alert('Sticker picker coming soon!');
  };


  // -----------------------------
  // VOICE RECORDER VIEW
  // -----------------------------
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


  // -----------------------------
  // MAIN INPUT UI
  // -----------------------------
  return (
    <div className="border-t bg-background">

      {replyTo && (
        <ReplyPreview message={replyTo} onCancel={onCancelReply} />
      )}

      {/* ATTACHMENT PREVIEWS */}
      {attachments.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group">
                {att.preview ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img src={att.preview} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="max-w-[120px]">
                      <p className="text-xs font-medium truncate">{att.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(att.size)}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUTS */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.csv"
        onChange={handleFileSelect}
      />
      <input
        ref={mediaInputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        multiple
        className="hidden"
        accept="audio/*"
        onChange={handleFileSelect}
      />

      {/* MAIN INPUT FORM */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end gap-2">

          {/* ATTACHMENT MENU */}
          <AttachmentMenu
            onDocument={handleDocumentClick}
            onMedia={handleMediaClick}
            onCamera={handleCameraClick}
            onAudio={handleAudioClick}
            onContact={handleContactClick}
            onPoll={() => setShowPollDialog(true)}
            onEvent={handleEventClick}
            onSticker={handleStickerClick}
            disabled={uploading}
            showPollOption={activeConversation?.type === 'group'}
          />

          {/* TEXT INPUT */}
          <div className="flex-1 relative bg-muted rounded-2xl">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent pr-12 py-3"
              rows={1}
              disabled={uploading}
            />

            <div className="absolute right-2 bottom-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5" />
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

          {/* SEND / VOICE BUTTON */}
          {content.trim() || attachments.length ? (
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 rounded-full" 
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
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setShowVoiceRecorder(true)}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}

        </div>
      </form>

      {/* POLL DIALOG */}
      <CreatePollDialog
        open={showPollDialog}
        onOpenChange={setShowPollDialog}
        onSubmit={handlePollSubmit}
        conversationId={activeConversation?._id}
      />

    </div>
  );
};

export default MessageInput;