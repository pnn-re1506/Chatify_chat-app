import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import GroupChatAvatar from "./GroupChatAvatar";
import StatusBadge from "./StatusBadge";
import type { Conversation, Participant } from "@/types/chat";

interface ConversationHeroProps {
  chat: Conversation;
  isDirect: boolean;
  otherUser: Participant | null;
  isOtherOnline: boolean;
  onlineCount?: number;
}

const ConversationHero = ({ chat, isDirect, otherUser, isOtherOnline, onlineCount = 0 }: ConversationHeroProps) => {
  return (
    <div className="flex flex-col items-center gap-3 pt-8 pb-6 px-5">
      <div className="relative">
        {isDirect && otherUser ? (
          <>
            <UserAvatar
              type="profile"
              name={otherUser.displayName}
              avatarUrl={otherUser.avatarUrl ?? undefined}
            />
            <StatusBadge
              status={isOtherOnline ? "online" : "offline"}
              className="!size-4 !bottom-0 !right-0 border-2 border-background"
            />
          </>
        ) : (
          <>
            <GroupChatAvatar participants={chat.participants} type="sidebar" />
            <StatusBadge
              status={onlineCount > 0 ? "online" : "offline"}
              className="!size-4 !bottom-0 !right-0 border-2 border-background"
            />
          </>
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-lg text-foreground">
          {isDirect ? otherUser?.displayName : chat.group?.name}
        </p>
        {isDirect && (
          <p
            className={cn(
              "text-sm font-medium mt-0.5",
              isOtherOnline ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {isOtherOnline ? "Active now" : "Offline"}
          </p>
        )}
        {!isDirect && (
          <p
            className={cn(
              "text-sm font-medium mt-0.5",
              onlineCount > 0 ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {onlineCount > 0 ? "Active now" : "Offline"}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationHero;
