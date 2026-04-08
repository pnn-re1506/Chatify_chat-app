import { memo } from "react";
import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
}

/** Format exact datetime as Month Day, HH:mm (e.g. March 25, 23:45) */
const formatExactTime = (date: Date) => {
  const datePart = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${time}`;
};

const MessageItem = memo(({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
}: MessageItemProps) => {
  // In chronological order: prev message is the one before (index - 1)
  const prev = index > 0 ? messages[index - 1] : undefined;

  const curDate = new Date(message.createdAt);
  const prevDate = prev ? new Date(prev.createdAt) : null;

  const isDifferentDay =
    prevDate !== null &&
    (curDate.getFullYear() !== prevDate.getFullYear() ||
      curDate.getMonth() !== prevDate.getMonth() ||
      curDate.getDate() !== prevDate.getDate());

  const isShowTime =
    index === 0 ||
    isDifferentDay ||
    curDate.getTime() - (prevDate?.getTime() || 0) > 900000; // 15 min

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );

  const hoverTimestamp = (
    <span
      className="self-center text-[13px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-150 select-none whitespace-nowrap"
    >
      {formatExactTime(new Date(message.createdAt))}
    </span>
  );

  return (
    <>
      {/* Time divider — rendered BEFORE the message in chronological order */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 py-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "group flex gap-2 message-bounce mt-1 items-center",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8 shrink-0">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Moji"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* hover time — left side (for own messages) */}
        {message.isOwn && hoverTimestamp}

        {/* message bubble */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          <Card
            className={cn(
              "p-3",
              message.isOwn
                ? "chat-bubble-sent border-0"
                : "chat-bubble-received"
            )}
          >
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
          </Card>

          {/* seen / delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>

        {/* hover time — right side (for received messages) */}
        {!message.isOwn && hoverTimestamp}
      </div>
    </>
  );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;
