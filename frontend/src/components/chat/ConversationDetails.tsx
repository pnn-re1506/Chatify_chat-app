import type { Conversation } from "@/types/chat";
import { X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

import ConversationHero from "./ConversationHero";
import ConversationInfo from "./ConversationInfo";
import ConversationParticipants from "./ConversationParticipants";

interface ConversationDetailsProps {
  chat: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

const ConversationDetails = ({ chat, isOpen, onClose }: ConversationDetailsProps) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  const isDirect = chat.type === "direct";
  const otherUser = isDirect
    ? chat.participants.find((p) => p._id !== user?._id) ?? null
    : null;

  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const onlineCount = isDirect
    ? 0
    : chat.participants.filter(
        (p) => p._id !== user?._id && onlineUsers.includes(p._id)
      ).length;

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-20 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute top-0 right-0 z-30 h-full w-80 flex flex-col bg-background border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-base text-foreground tracking-tight">
            Conversation Info
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto beautiful-scrollbar">
          <ConversationHero
            chat={chat}
            isDirect={isDirect}
            otherUser={otherUser}
            isOtherOnline={isOtherOnline}
            onlineCount={onlineCount}
          />
          <Separator />
          <ConversationInfo chat={chat} isDirect={isDirect} />
          <Separator />
          <ConversationParticipants
            chat={chat}
            isDirect={isDirect}
            onlineUsers={onlineUsers}
            currentUserId={user?._id}
          />
        </div>
      </aside>
    </>
  );
};

export default ConversationDetails;
