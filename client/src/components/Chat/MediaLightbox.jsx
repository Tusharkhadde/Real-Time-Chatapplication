import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const MediaLightbox = ({
  open,
  onOpenChange,
  items = [],
  index = 0,
  setIndex,
}) => {
  const current = items[index];

  // Keyboard controls
  useEffect(() => {
    if (!open) return;

    const handleKey = (e) => {
      if (e.key === "ArrowRight" && index < items.length - 1) {
        setIndex(index + 1);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        setIndex(index - 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, index, items.length, setIndex]);

  if (!current) return null;

  const isVideo = current.mimeType?.startsWith("video/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/90 border-none shadow-none p-2">
        <div className="flex items-center justify-center relative">
          {/* Prev Button */}
          {index > 0 && (
            <button
              className="absolute left-2 text-white text-3xl"
              onClick={() => setIndex(index - 1)}
            >
              ‹
            </button>
          )}

          {/* Media */}
          {isVideo ? (
            <video
              src={current.url}
              controls
              className="max-h-[85vh] rounded-lg"
            />
          ) : (
            <img
              src={current.url}
              alt="preview"
              className="max-h-[85vh] rounded-lg object-contain cursor-zoom-in"
            />
          )}

          {/* Next Button */}
          {index < items.length - 1 && (
            <button
              className="absolute right-2 text-white text-3xl"
              onClick={() => setIndex(index + 1)}
            >
              ›
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;