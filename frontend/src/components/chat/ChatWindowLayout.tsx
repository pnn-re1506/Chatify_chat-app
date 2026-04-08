import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import { SidebarInset } from "../ui/sidebar";
import ChatWindowHeader from "./ChatWindowHeader";
import ChatWindowBody from "./ChatWindowBody";
import MessageInput from "./MessageInput";
import { useEffect, useState } from "react";
import ChatWindowSkeleton from "../skeleton/ChatWindowSkeleton";
import ConversationDetails from "./ConversationDetails";

const ChatWindowLayout = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    messageLoading,
    markAsSeen,
  } = useChatStore();

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
        <MessageInput selectedConvo={selectedConvo} />
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