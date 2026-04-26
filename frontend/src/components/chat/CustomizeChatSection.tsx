import { useState } from "react";
import { Pencil } from "lucide-react";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import EmojiPicker from "./EmojiPicker";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface CustomizeChatSectionProps {
  chat: Conversation;
  isDirect: boolean;
}

const CustomizeChatSection = ({ chat, isDirect }: CustomizeChatSectionProps) => {
  const { user } = useAuthStore();
  const { setNickname, setQuickReactEmoji, updateGroupName } = useChatStore();

  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameValue, setGroupNameValue] = useState(chat.group?.name ?? "");

  if (!user) return null;

  const handleNicknameEdit = (participantId: string) => {
    setEditingNickname(participantId);
    setNicknameValue(chat.nicknames?.[participantId] ?? "");
  };

  const handleNicknameSave = async () => {
    if (editingNickname) {
      await setNickname(chat._id, editingNickname, nicknameValue);
      setEditingNickname(null);
    }
  };

  const handleGroupNameSave = async () => {
    if (groupNameValue.trim()) {
      await updateGroupName(chat._id, groupNameValue.trim());
      setEditingGroupName(false);
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    await setQuickReactEmoji(chat._id, emoji);
  };

  return (
    <div className="space-y-3">
      {!isDirect && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Group name</p>
          {editingGroupName ? (
            <div className="flex gap-2">
              <Input
                value={groupNameValue}
                onChange={(e) => setGroupNameValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleGroupNameSave()}
              />
              <Button size="sm" className="h-8" onClick={handleGroupNameSave}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setEditingGroupName(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => {
                setGroupNameValue(chat.group?.name ?? "");
                setEditingGroupName(true);
              }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
            >
              <Pencil size={14} className="text-muted-foreground" />
              <span>{chat.group?.name ?? "Unnamed group"}</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Nicknames</p>
        {chat.participants.map((p) => {
          const nickname = chat.nicknames?.[p._id];
          const isEditing = editingNickname === p._id;

          return (
            <div key={p._id} className="space-y-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={nicknameValue}
                    onChange={(e) => setNicknameValue(e.target.value)}
                    placeholder={p.displayName}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleNicknameSave()}
                  />
                  <Button size="sm" className="h-8" onClick={handleNicknameSave}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => setEditingNickname(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => handleNicknameEdit(p._id)}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                >
                  <Pencil size={14} className="text-muted-foreground" />
                  <span className="flex-1 text-left truncate">
                    {nickname ? (
                      <>
                        <span className="text-foreground">{nickname}</span>
                        <span className="text-muted-foreground ml-1">({p.displayName})</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{p.displayName} — Set nickname</span>
                    )}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Quick reaction</p>
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-lg">{chat.quickReactEmoji ?? "👍"}</span>
          <span className="text-sm text-muted-foreground">Change emoji</span>
          <EmojiPicker onChange={handleEmojiSelect} />
        </div>
      </div>
    </div>
  );
};

export default CustomizeChatSection;
