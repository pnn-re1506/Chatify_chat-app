import { useChatStore } from "@/stores/useChatStore";
import GroupChatCard from "./GroupChatCard";

const GroupChatList = () => {
  const { conversations } = useChatStore();

  if (!conversations) return;

  const groupchats = conversations
    .filter((convo) => convo.type === "group")
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? 0).getTime() -
        new Date(a.lastMessageAt ?? 0).getTime()
    );
  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {groupchats.map((convo) => (
        <GroupChatCard
          convo={convo}
          key={convo._id}
        />
      ))}
    </div>
  );
};

export default GroupChatList;