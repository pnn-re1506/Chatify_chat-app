import type { Conversation } from "@/types/chat";
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
}

const ConversationDetails = ({ chat, isOpen }: ConversationDetailsProps) => {
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
    <aside
      className={cn(
        "h-full w-80 shrink-0 flex flex-col bg-background border border-border rounded-sm shadow-md",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "opacity-100" : "w-0 opacity-0 border-0 pointer-events-none"
      )}
    >
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
  );
};

export default ConversationDetails;
