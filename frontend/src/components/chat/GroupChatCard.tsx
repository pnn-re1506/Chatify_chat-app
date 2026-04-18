import { useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import type { Conversation } from "@/types/chat";
import ChatCard, { type ChatCardMenuItem } from "./ChatCard";
import GroupChatAvatar from "./GroupChatAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { BellOff, Bell, Trash2 } from "lucide-react";
import MuteDialog from "./MuteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    activeConversationId,
    setActiveConversation,
    fetchMessages,
    muteConversation,
    unmuteConversation,
    deleteConversation,
  } = useChatStore();
  const { onlineUsers } = useSocketStore();

  const [muteOpen, setMuteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!user) return null;

  const unreadCount = convo.unreadCounts[user._id];
  const name = convo.group?.name ?? "";

  const mutedUntil = convo.mutedBy?.[user._id];
  const isMuted =
    mutedUntil === null ||
    (mutedUntil !== undefined && new Date(mutedUntil) > new Date());

  const hasOnlineMember = convo.participants.some(
    (p) => p._id !== user._id && onlineUsers.includes(p._id)
  );

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    const current = useChatStore.getState().messages[id];
    if (!current || current.nextCursor === undefined) {
      await fetchMessages(id);
    }
  };

  const menuItems: ChatCardMenuItem[] = [
    {
      label: isMuted ? "Unmute notifications" : "Mute notifications",
      icon: isMuted ? <Bell className="size-4" /> : <BellOff className="size-4" />,
      onClick: () => {
        if (isMuted) {
          unmuteConversation(convo._id);
        } else {
          setMuteOpen(true);
        }
      },
    },
    {
      label: "Delete chat",
      icon: <Trash2 className="size-4" />,
      onClick: () => setDeleteOpen(true),
      variant: "destructive",
    },
  ];

  return (
    <>
      <ChatCard
        convoId={convo._id}
        name={name}
        timestamp={
          convo.lastMessage?.createdAt
            ? new Date(convo.lastMessage.createdAt)
            : undefined
        }
        isActive={activeConversationId === convo._id}
        onSelect={handleSelectConversation}
        unreadCount={unreadCount}
        menuItems={menuItems}
        mutedIcon={isMuted ? <BellOff className="size-4" /> : undefined}
        leftSection={
          <>
            <GroupChatAvatar
              participants={convo.participants}
              type="chat"
            />
            <StatusBadge status={hasOnlineMember ? "online" : "offline"} />
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          </>
        }
        subtitle={
          <p className="text-sm truncate text-muted-foreground">
            {convo.participants.length} members
          </p>
        }
      />

      <MuteDialog
        open={muteOpen}
        onClose={() => setMuteOpen(false)}
        onConfirm={(durationMs) => muteConversation(convo._id, durationMs)}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will only remove the conversation from your list. Other participants
            won&apos;t be affected.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteConversation(convo._id);
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GroupChatCard;