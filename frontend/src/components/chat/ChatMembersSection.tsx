import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Crown } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useFriendStore } from "@/stores/useFriendStore";
import type { Conversation } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface ChatMembersSectionProps {
  chat: Conversation;
}

const ChatMembersSection = ({ chat }: ChatMembersSectionProps) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { addMember } = useChatStore();
  const { friends } = useFriendStore();
  const [addOpen, setAddOpen] = useState(false);

  if (!user) return null;

  const currentMemberIds = chat.participants.map((p) => p._id);
  const availableFriends = friends.filter(
    (f) => !currentMemberIds.includes(f._id)
  );

  const handleAddMember = async (userId: string) => {
    await addMember(chat._id, userId);
    setAddOpen(false);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">
            Members ({chat.participants.length})
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <UserPlus size={14} />
            <span>Add</span>
          </button>
        </div>

        <div className="space-y-1">
          {chat.participants.map((participant) => {
            const isOnline = onlineUsers.includes(participant._id);
            const isCreator = chat.group?.createdBy === participant._id;
            const isMe = participant._id === user._id;

            return (
              <div
                key={participant._id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors"
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          {availableFriends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No friends available to add.
            </p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto beautiful-scrollbar">
              {availableFriends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      type="chat"
                      name={friend.displayName}
                      avatarUrl={friend.avatarUrl ?? undefined}
                    />
                    <span className="text-sm font-medium truncate">
                      {friend.displayName}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMember(friend._id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatMembersSection;
