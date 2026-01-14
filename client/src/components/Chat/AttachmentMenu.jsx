import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Button } from "@components/ui/button";

import {
  FileText,
  Image,
  Camera,
  Headphones,
  User,
  BarChart3,
  Calendar,
  Sticker
} from "lucide-react";

const AttachmentMenu = ({
  onDocument,
  onMedia,
  onCamera,
  onAudio,
  onContact,
  onPoll,
  onEvent,
  onSticker
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
          +
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        className="w-56 rounded-xl p-2"
      >
        <DropdownMenuItem onClick={onDocument}>
          <FileText className="h-5 w-5 mr-3 text-blue-500" />
          Document
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onMedia}>
          <Image className="h-5 w-5 mr-3 text-green-500" />
          Photos & videos
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onCamera}>
          <Camera className="h-5 w-5 mr-3 text-pink-500" />
          Camera
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onAudio}>
          <Headphones className="h-5 w-5 mr-3 text-orange-500" />
          Audio
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onContact}>
          <User className="h-5 w-5 mr-3 text-cyan-500" />
          Contact
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onPoll}>
          <BarChart3 className="h-5 w-5 mr-3 text-yellow-500" />
          Poll
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onEvent}>
          <Calendar className="h-5 w-5 mr-3 text-purple-500" />
          Event
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onSticker}>
          <Sticker className="h-5 w-5 mr-3 text-emerald-500" />
          New sticker
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AttachmentMenu;
