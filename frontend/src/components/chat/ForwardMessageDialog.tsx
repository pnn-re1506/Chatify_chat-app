import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import UserAvatar from "./UserAvatar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ForwardMessageDialogProps {
  messageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ForwardMessageDialog = ({ messageId, open, onOpenChange }: ForwardMessageDialogProps) => {
  const { conversations, activeConversationId, forwardMessage } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [forwarding, setForwarding] = useState(false);

  const filtered = conversations.filter((c) => {
    if (c._id === activeConversationId) return false;
    if (c.type === "group") {
      return c.group?.name?.toLowerCase().includes(search.toLowerCase());
    }
    const other = c.participants.find((p) => p._id !== user?._id);
    return other?.displayName?.toLowerCase().includes(search.toLowerCase());
  });

  const handleForward = async (conversationId: string) => {
    if (!messageId) return;
    setForwarding(true);
    try {
      await forwardMessage(messageId, conversationId);
      toast.success("Message forwarded");
      onOpenChange(false);
      setSearch("");
    } catch {
      toast.error("Failed to forward message");
    } finally {
      setForwarding(false);
    }
  };

  const getConvoLabel = (convo: (typeof conversations)[0]) => {
    if (convo.type === "group") return convo.group?.name ?? "Group";
    const other = convo.participants.find((p) => p._id !== user?._id);
    return other?.displayName ?? "Unknown";
  };

  const getConvoAvatar = (convo: (typeof conversations)[0]) => {
    if (convo.type === "group") return { name: convo.group?.name ?? "G", url: undefined };
    const other = convo.participants.find((p) => p._id !== user?._id);
    return { name: other?.displayName ?? "U", url: other?.avatarUrl ?? undefined };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Forward to...</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search conversation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No conversations found</p>
          )}
          {filtered.map((convo) => {
            const avatar = getConvoAvatar(convo);
            return (
              <Button
                key={convo._id}
                variant="ghost"
                className="w-full justify-start gap-2 h-auto py-2"
                disabled={forwarding}
                onClick={() => handleForward(convo._id)}
              >
                {forwarding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserAvatar
                    type="chat"
                    name={avatar.name}
                    avatarUrl={avatar.url}
                  />
                )}
                <span className="truncate text-sm">{getConvoLabel(convo)}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
