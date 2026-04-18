import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Reaction } from "@/types/chat";

interface ReactionBarProps {
  messageId: string;
  reactions: Reaction[];
}

interface GroupedReaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

const ReactionBar = ({ messageId, reactions }: ReactionBarProps) => {
  const { user } = useAuthStore();
  const { toggleReaction } = useChatStore();

  if (!reactions || reactions.length === 0) return null;

  const grouped: GroupedReaction[] = [];
  const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

  for (const r of reactions) {
    const existing = emojiMap.get(r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === user?._id) existing.hasReacted = true;
    } else {
      emojiMap.set(r.emoji, { count: 1, hasReacted: r.userId === user?._id });
    }
  }

  for (const [emoji, data] of emojiMap) {
    grouped.push({ emoji, ...data });
  }

  return (
    <div className="flex gap-1 flex-wrap justify-end self-end">
      {grouped.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(messageId, emoji)}
          className={cn(
            "flex items-center gap-0.5 px-1 py-px rounded-full text-[10px] border transition-colors cursor-pointer",
            hasReacted
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <span className="text-xs leading-none">{emoji}</span>
          {count > 1 && <span className="text-[9px] font-medium">{count}</span>}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
