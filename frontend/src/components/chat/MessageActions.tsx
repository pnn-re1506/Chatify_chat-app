import { useState } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/useChatStore";
import type { Message, Conversation, Participant } from "@/types/chat";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SmilePlus, Reply, MoreHorizontal, Copy, Forward, Undo2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const QUICK_EMOJIS = ["❤️", "😆", "😮", "😢", "😡", "👍"];

interface MessageActionsProps {
  message: Message;
  selectedConvo: Conversation;
  onForward: () => void;
}

const MessageActions = ({ message, selectedConvo, onForward }: MessageActionsProps) => {
  const { setReplyingTo, toggleReaction, unsendMessage } = useChatStore();
  const [reactionOpen, setReactionOpen] = useState(false);

  const isOwn = message.isOwn;
  const isUnsent = !!message.deletedAt;

  if (isUnsent) return null;

  const handleReply = () => {
    const participant = selectedConvo.participants.find(
      (p: Participant) => p._id.toString() === message.senderId.toString()
    );
    setReplyingTo({
      messageId: message._id,
      content: message.content ?? "",
      senderName: participant?.displayName ?? "Unknown",
    });
  };

  const handleCopy = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    }
  };

  const handleUnsend = async () => {
    await unsendMessage(message._id);
  };

  const handleRemove = async () => {
    await useChatStore.getState().removeMessage(message._id);
    toast.success("Message removed for you");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Reaction picker */}
      <Popover open={reactionOpen} onOpenChange={setReactionOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 rounded-full hover:bg-muted">
            <SmilePlus className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1.5 flex flex-row gap-1" side="top" align="center">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer"
              onClick={() => {
                toggleReaction(message._id, emoji);
                setReactionOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Reply */}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full hover:bg-muted"
        onClick={handleReply}
      >
        <Reply className="size-3.5 text-muted-foreground" />
      </Button>

      {/* More / Context menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7 rounded-full hover:bg-muted">
            <MoreHorizontal className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={isOwn ? "left" : "right"} align="start" className="w-40">
          {message.content && (
            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
              <Copy className="size-3.5 mr-2" />
              Copy
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onForward} className="cursor-pointer">
            <Forward className="size-3.5 mr-2" />
            Forward
          </DropdownMenuItem>
          {isOwn ? (
            <DropdownMenuItem onClick={handleUnsend} className="cursor-pointer text-destructive focus:text-destructive">
              <Undo2 className="size-3.5 mr-2" />
              Unsend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRemove} className="cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="size-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MessageActions;
