import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";
import ConversationDetails from "./ConversationDetails";
import { ShieldOff } from "lucide-react";
import { Button } from "../ui/button";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    messageLoading,
    markAsSeen,
    unblockUser,
  } = useChatStore();
  const { user } = useAuthStore();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const selectedConvo =
    conversations.find((c) => c._id === activeConversationId) ?? null;

  // Reset panel when conversation changes
  useEffect(() => {
    setIsDetailsOpen(false);
  }, [activeConversationId]);

  useEffect(() => {
    if (!selectedConvo) {
      return;
    }

    const markSeen = async () => {
      try {
        await markAsSeen();
      } catch (error) {
        console.error("Error when markSeen", error);
      }
    };

    markSeen();
  }, [markAsSeen, selectedConvo]);

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  const hasMessages =
    (allMessages[activeConversationId ?? ""]?.items.length ?? 0) > 0;

  if (messageLoading && !hasMessages) {
    return <ChatWindowSkeleton />;
  }

  const blockedBy = selectedConvo.blockedBy ?? [];
  const isBlocker = user ? blockedBy.includes(user._id) : false;
  const isBlocked = !isBlocker && blockedBy.length > 0;

  return (
    <div className="flex h-full w-full gap-2 overflow-hidden">
      <SidebarInset className="relative flex flex-col h-full flex-1 min-w-0 overflow-hidden rounded-sm shadow-md">
        {/* Header */}
        <ChatWindowHeader
          chat={selectedConvo}
          isDetailsOpen={isDetailsOpen}
          onToggleDetails={() => setIsDetailsOpen((prev) => !prev)}
        />

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-primary-foreground">
          <ChatWindowBody />
        </div>

        {/* Footer */}
        {isBlocker ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-muted/40 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldOff className="size-4 shrink-0" />
              <span>You have blocked this user. Unblock to send messages.</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => unblockUser(selectedConvo._id)}
            >
              Unblock
            </Button>
          </div>
        ) : isBlocked ? (
          <div className="flex items-center gap-2 p-4 bg-muted/40 border-t text-sm text-muted-foreground">
            <ShieldOff className="size-4 shrink-0" />
            <span>You can&apos;t reply to this conversation.</span>
          </div>
        ) : (
          <MessageInput selectedConvo={selectedConvo} />
        )}
      </SidebarInset>

      {/* Side panel — sits beside the chat, never overlays */}
      <ConversationDetails
        chat={selectedConvo}
        isOpen={isDetailsOpen}
      />
    </div>
  );
};

export default ChatWindowLayout;