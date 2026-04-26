import { useEffect, useState } from "react";
import { Pin, X } from "lucide-react";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation, PinnedMessage } from "@/types/chat";
import UserAvatar from "./UserAvatar";

interface ChatInfoSectionProps {
  chat: Conversation;
}

const ChatInfoSection = ({ chat }: ChatInfoSectionProps) => {
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { unpinMessage, setHighlightedMessageId } = useChatStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    chatService
      .getPinnedMessages(chat._id)
      .then((msgs) => {
        if (!cancelled) setPinned(msgs);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [chat._id, chat.pinnedMessages]);

  const handleUnpin = async (messageId: string) => {
    await unpinMessage(chat._id, messageId);
    setPinned((prev) => prev.filter((m) => m._id !== messageId));
  };

  const handleClick = (messageId: string) => {
    setHighlightedMessageId(messageId);
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Loading pinned messages...
      </div>
    );
  }

  if (pinned.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        No pinned messages
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pinned.map((msg) => (
        <div
          key={msg._id}
          className="group flex items-start gap-2.5 rounded-lg p-2 hover:bg-muted/60 transition-colors cursor-pointer"
          onClick={() => handleClick(msg._id)}
        >
          <div className="shrink-0 mt-0.5">
            <UserAvatar
              type="chat"
              name={msg.senderName}
              avatarUrl={msg.senderAvatar ?? undefined}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Pin size={12} className="text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">
                {msg.senderName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {msg.content || (msg.imgUrl ? "📷 Image" : "Empty message")}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnpin(msg._id);
            }}
            className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded hover:bg-muted transition-all"
            aria-label="Unpin message"
          >
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatInfoSection;
