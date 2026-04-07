import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import { Info } from "lucide-react";

const ChatWindowHeader = ({
  chat,
  onOpenDetails,
}: {
  chat?: Conversation;
  onOpenDetails?: () => void;
}) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();

  let otherUser;

  chat = chat ?? conversations.find((c) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return;
  }

  const isOnline =
    chat.type === "direct"
      ? onlineUsers.includes(otherUser?._id ?? "")
      : chat.participants.some(
          (p) => p._id !== user?._id && onlineUsers.includes(p._id)
        );

  return (
    <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background">
      <div className="flex items-center gap-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />

        <div className="p-2 w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* avatar */}
            <div className="relative">
              {chat.type === "direct" ? (
                <>
                  <UserAvatar
                    type={"sidebar"}
                    name={otherUser?.displayName || "Chatify"}
                    avatarUrl={otherUser?.avatarUrl || undefined}
                  />
                  <StatusBadge status={isOnline ? "online" : "offline"} />
                </>
              ) : (
                <>
                  <GroupChatAvatar
                    participants={chat.participants}
                    type="sidebar"
                  />
                  <StatusBadge status={isOnline ? "online" : "offline"} />
                </>
              )}
            </div>

            {/* name */}
            <h2 className="font-semibold text-foreground">
              {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
            </h2>
          </div>

          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors ml-auto"
              aria-label="Conversation details"
            >
              <Info size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatWindowHeader;