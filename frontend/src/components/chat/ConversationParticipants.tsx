import type { Conversation } from "@/types/chat";
import { Crown } from "lucide-react";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";

interface ConversationParticipantsProps {
  chat: Conversation;
  isDirect: boolean;
  onlineUsers: string[];
  currentUserId?: string;
}

const ConversationParticipants = ({
  chat,
  isDirect,
  onlineUsers,
  currentUserId,
}: ConversationParticipantsProps) => {
  return (
    <div className="px-5 py-5 space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {isDirect ? "Participants" : `Members (${chat.participants.length})`}
      </h4>

      <div className="space-y-2">
        {chat.participants.map((participant) => {
          const isOnline = onlineUsers.includes(participant._id);
          const isCreator = !isDirect && chat.group?.createdBy === participant._id;
          const isMe = participant._id === currentUserId;

          return (
            <div
              key={participant._id}
              className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/60 transition-colors"
            >
              <div className="relative shrink-0">
                <UserAvatar
                  type="chat"
                  name={participant.displayName}
                  avatarUrl={participant.avatarUrl ?? undefined}
                />
                <StatusBadge status={isOnline ? "online" : "offline"} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">
                    {participant.displayName}
                  </span>
                  {isMe && (
                    <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                      (You)
                    </span>
                  )}
                  {isCreator && (
                    <Crown
                      size={12}
                      className="text-amber-400 shrink-0"
                      aria-label="Group creator"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOnline ? "Active now" : "Offline"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationParticipants;
