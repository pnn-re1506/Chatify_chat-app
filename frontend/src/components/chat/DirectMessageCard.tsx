import { useState } from "react";
import type { Conversation } from "@/types/chat";
import ChatCard, { type ChatCardMenuItem } from "./ChatCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import UnreadCountBadge from "./UnreadCountBadge";
import { useSocketStore } from "@/stores/useSocketStore";
import { BellOff, Bell, User, ShieldOff, Shield, Trash2 } from "lucide-react";
import MuteDialog from "./MuteDialog";
import UserBioDialog from "./UserBioDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    activeConversationId,
    setActiveConversation,
    messages,
    fetchMessages,
    muteConversation,
    unmuteConversation,
    blockUser,
    unblockUser,
    deleteConversation,
  } = useChatStore();
  const { onlineUsers } = useSocketStore();

  const [muteOpen, setMuteOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (!user) return null;

  const otherUser = convo.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const unreadCount = convo.unreadCounts[user._id];
  const lastMessage = convo.lastMessage?.content ?? "";

  const mutedUntil = convo.mutedBy?.[user._id];
  const isMuted =
    mutedUntil === null ||
    (mutedUntil !== undefined && new Date(mutedUntil) > new Date());

  const isBlocker = (convo.blockedBy ?? []).includes(user._id);
  const isBlocked = !isBlocker && (convo.blockedBy ?? []).length > 0;

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
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
      label: "View profile",
      icon: <User className="size-4" />,
      onClick: () => setBioOpen(true),
    },
    {
      label: isBlocker ? "Unblock" : "Block",
      icon: isBlocker ? <Shield className="size-4" /> : <ShieldOff className="size-4" />,
      onClick: () => {
        if (isBlocker) {
          unblockUser(convo._id);
        } else {
          setBlockOpen(true);
        }
      },
      variant: isBlocker ? "default" : "destructive",
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
        name={otherUser.displayName ?? ""}
        timestamp={
          convo.lastMessage?.createdAt
            ? new Date(convo.lastMessage.createdAt)
            : undefined
        }
        isActive={activeConversationId === convo._id}
        onSelect={handleSelectConversation}
        unreadCount={unreadCount}
        mutedIcon={isMuted ? <BellOff className="size-4" /> : undefined}
        menuItems={menuItems}
        leftSection={
          <>
            <UserAvatar
              type="sidebar"
              name={otherUser.displayName ?? ""}
              avatarUrl={otherUser.avatarUrl ?? undefined}
            />
            <StatusBadge
              status={
                onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
              }
            />
            {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          </>
        }
        subtitle={
          <p
            className={cn(
              "text-sm truncate",
              unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
            )}
          >
            {isBlocked ? (
              <span className="italic text-muted-foreground">Conversation blocked</span>
            ) : (
              lastMessage
            )}
          </p>
        }
      />

      <MuteDialog
        open={muteOpen}
        onClose={() => setMuteOpen(false)}
        onConfirm={(durationMs) => muteConversation(convo._id, durationMs)}
      />

      <UserBioDialog
        open={bioOpen}
        onClose={() => setBioOpen(false)}
        userId={otherUser._id}
        displayName={otherUser.displayName ?? ""}
      />

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Block {otherUser.displayName}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You and {otherUser.displayName} will not be able to message or call each other.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                blockUser(convo._id);
                setBlockOpen(false);
              }}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default DirectMessageCard;