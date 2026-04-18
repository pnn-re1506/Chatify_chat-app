import { memo } from "react";
import { cn, formatMessageTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import MessageActions from "./MessageActions";
import ReactionBar from "./ReactionBar";
import SeenAvatars from "./SeenAvatars";
import { Forward } from "lucide-react";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  seenUsers?: Participant[];
  onForward: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

/** Format exact datetime as Month Day, HH:mm (e.g. March 25, 23:45) */
const formatExactTime = (date: Date) => {
  const datePart = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${time}`;
};

const hasForwardedFrom = (msg: Message) =>
  msg.forwardedFrom && msg.forwardedFrom.originalSenderId;

const hasReplyTo = (msg: Message) =>
  msg.replyTo && msg.replyTo.messageId;

const MessageItem = memo(({
  message,
  index,
  messages,
  selectedConvo,
  seenUsers = [],
  onForward,
  onScrollToMessage,
}: MessageItemProps) => {
  const currentUserId = useAuthStore.getState().user?._id;

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

  const isUnsent = !!message.deletedAt;
  const isForwarded = hasForwardedFrom(message);
  const isReply = hasReplyTo(message);

  const hoverTimestamp = (
    <span
      className="self-center text-[13px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-150 select-none whitespace-nowrap"
    >
      {formatExactTime(new Date(message.createdAt))}
    </span>
  );

  // Bug 1: Forward label inside bubble — reflects who forwarded
  const forwardLabel = isForwarded && !isUnsent
    ? message.isOwn
      ? "You forwarded a message"
      : `${participant?.displayName ?? "Someone"} forwarded a message`
    : null;

  // Bug 2: "replied to" label — uses "you" when appropriate
  const replyLabel = isReply && !isUnsent
    ? (() => {
      const repliedToId = message.replyTo!.senderId;
      const repliedToName = repliedToId === currentUserId
        ? "you"
        : (message.replyTo!.senderName || "someone");
      const senderName = message.isOwn
        ? "You"
        : (participant?.displayName ?? "Someone");
      return `${senderName} replied to ${repliedToName}`;
    })()
    : null;

  return (
    <>
      {/* Time divider — rendered BEFORE the message in chronological order */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 py-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        id={`msg-${message._id}`}
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

        {/* hover time + actions — left side (for own messages) */}
        {message.isOwn && (
          <>
            {hoverTimestamp}
            <MessageActions
              message={message}
              selectedConvo={selectedConvo}
              onForward={() => onForward(message._id)}
            />
          </>
        )}

        {/* message column: labels above → bubble → reactions below */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          {/* Forward label — outside bubble */}
          {forwardLabel && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
              <Forward className="size-3" />
              <span>{forwardLabel}</span>
            </div>
          )}

          {/* Reply label — outside bubble */}
          {replyLabel && (
            <p className="text-[11px] text-muted-foreground mb-0.5">
              {replyLabel}
            </p>
          )}

          {/* Reply quoted block — outside bubble, above it */}
          {isReply && !isUnsent && (
            <button
              onClick={() => onScrollToMessage?.(message.replyTo!.messageId)}
              className="w-full text-left mb-0.5 px-2 py-1 rounded bg-muted/60 border-l-2 border-primary/50 cursor-pointer hover:bg-muted/80 transition-colors"
            >
              <p className="text-[11px] text-muted-foreground truncate">
                {message.replyTo!.content || "Message"}
              </p>
            </button>
          )}

          {/* Message bubble — only contains message content */}
          <Card
            className={cn(
              "p-3",
              message.isOwn
                ? "chat-bubble-sent border-0"
                : "chat-bubble-received",
              isUnsent && "opacity-60 italic"
            )}
          >
            {isUnsent ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                This message was unsent
              </p>
            ) : (
              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            )}
          </Card>

          {/* Reactions — always right-aligned */}
          {!isUnsent && (
            <ReactionBar
              messageId={message._id}
              reactions={message.reactions ?? []}
            />
          )}

          {/* Seen avatars — only show below own messages */}
          {message.isOwn && <SeenAvatars seenUsers={seenUsers} />}
        </div>

        {/* hover actions + time — right side (for received messages) */}
        {!message.isOwn && (
          <>
            <MessageActions
              message={message}
              selectedConvo={selectedConvo}
              onForward={() => onForward(message._id)}
            />
            {hoverTimestamp}
          </>
        )}
      </div>
    </>
  );
});

MessageItem.displayName = "MessageItem";

export default MessageItem;
