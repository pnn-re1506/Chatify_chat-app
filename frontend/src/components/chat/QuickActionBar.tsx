import { useState } from "react";
import { User, BellOff, Bell, Search } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation, Participant } from "@/types/chat";
import UserBioDialog from "./UserBioDialog";
import MuteDialog from "./MuteDialog";

interface QuickActionBarProps {
  chat: Conversation;
  isDirect: boolean;
  otherUser: Participant | null;
  onSearchOpen: () => void;
}

const QuickActionBar = ({ chat, isDirect, otherUser, onSearchOpen }: QuickActionBarProps) => {
  const { user } = useAuthStore();
  const { muteConversation, unmuteConversation } = useChatStore();

  const [bioOpen, setBioOpen] = useState(false);
  const [muteOpen, setMuteOpen] = useState(false);

  const mutedUntil = chat.mutedBy?.[user?._id ?? ""];
  const isMuted =
    mutedUntil === null ||
    (mutedUntil !== undefined && new Date(mutedUntil) > new Date());

  const handleMuteToggle = () => {
    if (isMuted) {
      unmuteConversation(chat._id);
    } else {
      setMuteOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4 px-5 pb-4">
        {isDirect && otherUser && (
          <QuickActionButton
            icon={<User size={18} />}
            label="Profile"
            onClick={() => setBioOpen(true)}
          />
        )}
        <QuickActionButton
          icon={isMuted ? <Bell size={18} /> : <BellOff size={18} />}
          label={isMuted ? "Unmute" : "Mute"}
          onClick={handleMuteToggle}
        />
        <QuickActionButton
          icon={<Search size={18} />}
          label="Search"
          onClick={onSearchOpen}
        />
      </div>

      {isDirect && otherUser && (
        <UserBioDialog
          open={bioOpen}
          onClose={() => setBioOpen(false)}
          userId={otherUser._id}
          displayName={otherUser.displayName ?? ""}
        />
      )}

      <MuteDialog
        open={muteOpen}
        onClose={() => setMuteOpen(false)}
        onConfirm={(durationMs) => muteConversation(chat._id, durationMs)}
      />
    </>
  );
};

const QuickActionButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 hover:bg-muted/60 transition-colors"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
  </button>
);

export default QuickActionBar;
