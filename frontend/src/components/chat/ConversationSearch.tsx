import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/useChatStore";
import type { SearchResult } from "@/types/chat";
import { Input } from "../ui/input";
import UserAvatar from "./UserAvatar";

interface ConversationSearchProps {
  conversationId: string;
  onClose: () => void;
}

const ConversationSearch = ({ conversationId, onClose }: ConversationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { setHighlightedMessageId } = useChatStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    async (q: string, cursor?: string) => {
      if (!q.trim()) {
        setResults([]);
        setNextCursor(null);
        return;
      }
      setLoading(true);
      try {
        const res = await chatService.searchMessages(conversationId, q, 20, cursor);
        setResults((prev) => (cursor ? [...prev, ...res.messages] : res.messages));
        setNextCursor(res.nextCursor);
      } catch (error) {
        console.error("Error searching messages", error);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(value);
    }, 400);
  };

  const handleResultClick = (messageId: string) => {
    setHighlightedMessageId(messageId);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 border-b">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
          aria-label="Close search"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search in conversation..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto beautiful-scrollbar">
        {loading && results.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Searching...
          </div>
        ) : !query.trim() ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Type to search messages
          </div>
        ) : results.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No messages found
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {results.map((msg) => (
              <button
                key={msg._id}
                onClick={() => handleResultClick(msg._id)}
                className="flex items-start gap-2.5 w-full rounded-lg p-2.5 text-left hover:bg-muted/60 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  <UserAvatar
                    type="chat"
                    name={msg.senderName}
                    avatarUrl={msg.senderAvatar ?? undefined}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground truncate">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {msg.content}
                  </p>
                </div>
              </button>
            ))}
            {nextCursor && (
              <button
                onClick={() => doSearch(query, nextCursor)}
                disabled={loading}
                className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {loading ? "Loading..." : "Load more results"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSearch;
