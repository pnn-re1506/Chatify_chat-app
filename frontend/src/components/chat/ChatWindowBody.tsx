import { useChatStore } from "@/stores/useChatStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useScrollPagination } from "@/hooks/useScrollPagination";
import { Loader2 } from "lucide-react";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    isFetchingMore,
    fetchMessages,
  } = useChatStore();

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const isFetching = isFetchingMore[activeConversationId!] ?? false;
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);

  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);

  const handleLoadMore = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      await fetchMessages(activeConversationId);
    } catch (error) {
      console.error("Error when fetch more messages", error);
    }
  }, [activeConversationId, fetchMessages]);

  const { scrollToBottom } = useScrollPagination({
    containerRef,
    hasMore,
    isFetching,
    onLoadMore: handleLoadMore,
    itemCount: messages.length,
  });

  // Scroll to bottom on conversation switch
  useLayoutEffect(() => {
    initialScrollDone.current = false;
  }, [activeConversationId]);

  useEffect(() => {
    if (messages.length > 0 && !initialScrollDone.current) {
      requestAnimationFrame(() => {
        scrollToBottom();
        initialScrollDone.current = true;
      });
    }
  }, [messages.length, scrollToBottom]);

  // Seen status
  const seenBy = selectedConvo?.seenBy ?? [];
  const lastMessageStatus: "delivered" | "seen" = seenBy.length > 0 ? "seen" : "delivered";

  if (!selectedConvo) {
    return <ChatWelcomeScreen />;
  }

  if (!messages?.length) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        There are no messages in this conversation.
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary-foreground h-full flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden beautiful-scrollbar"
      >
        {/* Top loading spinner */}
        {isFetching && (
          <div className="flex items-center justify-center py-3 shrink-0">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-xs text-muted-foreground">
              Loading older messages...
            </span>
          </div>
        )}

        {/* HasMore spacer — prevents content from being flush with top */}
        {hasMore && !isFetching && (
          <div className="h-4 shrink-0" />
        )}

        {/* Messages in chronological order (oldest first) */}
        {messages.map((message, index) => (
          <MessageItem
            key={message._id ?? index}
            message={message}
            index={index}
            messages={messages}
            selectedConvo={selectedConvo}
            lastMessageStatus={lastMessageStatus}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatWindowBody;