import { useState } from "react";
import { ShieldOff, Shield, BellOff, Bell, Trash2, LogOut } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import MuteDialog from "./MuteDialog";
import LeaveGroupDialog from "./LeaveGroupDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface PrivacySupportSectionProps {
  chat: Conversation;
  isDirect: boolean;
}

const PrivacySupportSection = ({ chat, isDirect }: PrivacySupportSectionProps) => {
  const { user } = useAuthStore();
  const {
    muteConversation,
    unmuteConversation,
    blockUser,
    unblockUser,
    deleteConversation,
    leaveGroup,
  } = useChatStore();

  const [muteOpen, setMuteOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  if (!user) return null;

  const mutedUntil = chat.mutedBy?.[user._id];
  const isMuted =
    mutedUntil === null ||
    (mutedUntil !== undefined && new Date(mutedUntil) > new Date());

  const isBlocker = (chat.blockedBy ?? []).includes(user._id);

  const otherUser = isDirect
    ? chat.participants.find((p) => p._id !== user._id)
    : null;

  return (
    <>
      <div className="space-y-1">
        {isDirect && (
          <ActionRow
            icon={isBlocker ? <Shield size={16} /> : <ShieldOff size={16} />}
            label={isBlocker ? "Unblock" : "Block"}
            variant={isBlocker ? "default" : "destructive"}
            onClick={() => {
              if (isBlocker) {
                unblockUser(chat._id);
              } else {
                setBlockOpen(true);
              }
            }}
          />
        )}

        <ActionRow
          icon={isMuted ? <Bell size={16} /> : <BellOff size={16} />}
          label={isMuted ? "Unmute notifications" : "Mute notifications"}
          onClick={() => {
            if (isMuted) {
              unmuteConversation(chat._id);
            } else {
              setMuteOpen(true);
            }
          }}
        />

        <ActionRow
          icon={<Trash2 size={16} />}
          label="Delete chat"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        />

        {!isDirect && (
          <ActionRow
            icon={<LogOut size={16} />}
            label="Leave group"
            variant="destructive"
            onClick={() => setLeaveOpen(true)}
          />
        )}
      </div>

      <MuteDialog
        open={muteOpen}
        onClose={() => setMuteOpen(false)}
        onConfirm={(durationMs) => muteConversation(chat._id, durationMs)}
      />

      {isDirect && otherUser && (
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
                  blockUser(chat._id);
                  setBlockOpen(false);
                }}
              >
                Block
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                deleteConversation(chat._id);
                setDeleteOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isDirect && (
        <LeaveGroupDialog
          open={leaveOpen}
          onClose={() => setLeaveOpen(false)}
          groupName={chat.group?.name ?? "this group"}
          onConfirm={() => {
            leaveGroup(chat._id);
            setLeaveOpen(false);
          }}
        />
      )}
    </>
  );
};

const ActionRow = ({
  icon,
  label,
  variant = "default",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "destructive";
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/60 ${
      variant === "destructive" ? "text-destructive" : "text-foreground"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default PrivacySupportSection;
