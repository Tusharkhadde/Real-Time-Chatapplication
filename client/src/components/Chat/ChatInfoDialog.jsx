import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediaLightbox from "./MediaLightbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { Download, ExternalLink, FileText, Play } from "lucide-react";

const ChatInfoDialog = ({ open, onOpenChange, conversation }) => {
  // ✅ All hooks at the top
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // ✅ Get messages and scrollToMessage from context
  const { messages, scrollToMessage } = useChat();

  // Helper functions
  const extractUrlsFromText = useCallback((text = "") => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    return text.match(urlRegex) || [];
  }, []);

  const getInitials = useCallback((name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  []);

  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }, []);

  // ✅ Use messages from context instead of conversation.messages
  const mediaFiles = useMemo(() => {
    const msgs = messages || [];
    return msgs
      .flatMap((m) =>
        (m.attachments || []).map((att) => ({
          ...att,
          messageId: m._id,
          sender: m.sender?.username,
          createdAt: m.createdAt,
        }))
      )
      .filter(
        (a) =>
          a.mimeType?.startsWith("image/") || a.mimeType?.startsWith("video/")
      );
  }, [messages]);

  const sharedLinks = useMemo(() => {
    const msgs = messages || [];
    return msgs
      .filter((m) => m?.content)
      .flatMap((m) =>
        extractUrlsFromText(m.content).map((url) => ({
          url: url.startsWith("http") ? url : `https://${url}`,
          messageId: m._id,
          sender: m.sender?.username,
          createdAt: m.createdAt,
        }))
      );
  }, [messages, extractUrlsFromText]);

  const documentFiles = useMemo(() => {
    const msgs = messages || [];
    return msgs
      .flatMap((m) =>
        (m.attachments || []).map((att) => ({
          ...att,
          messageId: m._id,
          sender: m.sender?.username,
          createdAt: m.createdAt,
        }))
      )
      .filter(
        (a) =>
          a.mimeType &&
          !a.mimeType.startsWith("image/") &&
          !a.mimeType.startsWith("video/") &&
          !a.mimeType.startsWith("audio/")
      );
  }, [messages]);

  // ✅ Handler to jump to message
  const handleJumpToMessage = useCallback((messageId) => {
    onOpenChange(false); // Close dialog first
    scrollToMessage(messageId); // Then scroll to message
  }, [onOpenChange, scrollToMessage]);

  const handleOpenLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Early return AFTER all hooks
  if (!conversation) return null;

  const isGroup = conversation.type === "group";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chat Info</DialogTitle>
        </DialogHeader>

        {/* Header with avatar */}
        <div className="flex gap-4 items-center mb-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={conversation.avatar} />
            <AvatarFallback className="text-lg">
              {getInitials(conversation.name || "Chat")}
            </AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold text-lg">
              {conversation.name || "Private Chat"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGroup
                ? `${conversation.participants?.length || 0} members`
                : "Private Conversation"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="media">
          <TabsList className="w-full">
            <TabsTrigger value="media" className="flex-1">
              Media ({mediaFiles.length})
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex-1">
              Docs ({documentFiles.length})
            </TabsTrigger>
            <TabsTrigger value="links" className="flex-1">
              Links ({sharedLinks.length})
            </TabsTrigger>
          </TabsList>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-4">
            {mediaFiles.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No media shared yet
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    <button
                      className="relative rounded-lg overflow-hidden aspect-square w-full"
                      onClick={() => handleOpenLightbox(idx)}
                    >
                      {file.mimeType?.startsWith("video/") ? (
                        <div className="relative w-full h-full bg-muted">
                          <video
                            src={file.url}
                            className="object-cover w-full h-full"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                              <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={file.originalName}
                          className="object-cover w-full h-full group-hover:opacity-90 transition"
                          loading="lazy"
                        />
                      )}
                    </button>

                    {/* ✅ Jump to message button */}
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJumpToMessage(file.messageId);
                      }}
                      title="Jump to message"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="docs" className="mt-4">
            {documentFiles.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No documents shared yet
              </div>
            ) : (
              <div className="space-y-2">
                {documentFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {file.originalName || file.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.sender && ` • ${file.sender}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* ✅ Jump to message */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleJumpToMessage(file.messageId)}
                        title="Jump to message"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <a
                        href={file.url}
                        download={file.originalName || file.filename}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-4">
            {sharedLinks.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No links shared yet
              </div>
            ) : (
              <div className="space-y-2">
                {sharedLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition group"
                  >
                    {/* ✅ Click to jump to message */}
                    <button
                      onClick={() => handleJumpToMessage(link.messageId)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-medium truncate text-primary hover:underline">
                        {link.url}
                      </p>
                      {link.sender && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Shared by {link.sender}
                          {link.createdAt && (
                            <span>
                              {" "}• {new Date(link.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      )}
                    </button>

                    {/* Open link in new tab */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-2"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Lightbox */}
        <MediaLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          items={mediaFiles}
          index={lightboxIndex}
          setIndex={setLightboxIndex}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChatInfoDialog;