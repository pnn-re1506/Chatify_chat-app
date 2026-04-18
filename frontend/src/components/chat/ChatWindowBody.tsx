import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import ChatWelcomeScreen from "./ChatWelcomeScreen";
import MessageItem from "./MessageItem";
import ForwardMessageDialog from "./ForwardMessageDialog";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useScrollPagination } from "@/hooks/useScrollPagination";
import { Loader2 } from "lucide-react";
import type { Participant } from "@/types/chat";

const ChatWindowBody = () => {
  const {
    activeConversationId,
    conversations,
    messages: allMessages,
    isFetchingMore,
    fetchMessages,
  } = useChatStore();
  const { user } = useAuthStore();

  const messages = allMessages[activeConversationId!]?.items ?? [];
  const hasMore = allMessages[activeConversationId!]?.hasMore ?? false;
  const isFetching = isFetchingMore[activeConversationId!] ?? false;
  const selectedConvo = conversations.find((c) => c._id === activeConversationId);

  const containerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);

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

  // Compute per-message seen users from seenBy map { userId -> messageId }
  // Bug 4: Only attach seen avatars to messages the current user sent
  const seenByMessageId = useMemo(() => {
    const seenBy = selectedConvo?.seenBy ?? {};
    const ownMessageIds = new Set(
      messages.filter((m) => m.senderId === user?._id).map((m) => m._id)
    );
    const result: Record<string, Participant[]> = {};

    for (const [userId, messageId] of Object.entries(seenBy)) {
      if (userId === user?._id) continue;
      const msgId = String(messageId);
      if (!ownMessageIds.has(msgId)) continue;
      if (!result[msgId]) result[msgId] = [];
      const participant = selectedConvo?.participants.find(
        (p) => p._id.toString() === userId
      );
      if (participant) {
        result[msgId].push(participant);
      }
    }

    return result;
  }, [selectedConvo?.seenBy, selectedConvo?.participants, user?._id, messages]);

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-primary/10");
      setTimeout(() => el.classList.remove("bg-primary/10"), 1500);
    }
  }, []);

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
            seenUsers={seenByMessageId[message._id] ?? []}
            onForward={setForwardingMessageId}
            onScrollToMessage={handleScrollToMessage}
          />
        ))}
      </div>

      <ForwardMessageDialog
        messageId={forwardingMessageId}
        open={!!forwardingMessageId}
        onOpenChange={(open) => { if (!open) setForwardingMessageId(null); }}
      />
    </div>
  );
};

export default ChatWindowBody;