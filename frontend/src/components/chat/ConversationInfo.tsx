import type { Conversation } from "@/types/chat";
import { Users, User, Calendar, Clock, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationInfoProps {
  chat: Conversation;
  isDirect: boolean;
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ConversationInfo = ({ chat, isDirect }: ConversationInfoProps) => {
  return (
    <div className="px-5 py-5 space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Details
      </h4>

      <InfoRow
        icon={<Hash size={15} />}
        label="Conversation ID"
        value={chat._id}
        mono
        truncate
      />

      <InfoRow
        icon={isDirect ? <User size={15} /> : <Users size={15} />}
        label="Type"
        value={isDirect ? "Direct Message" : "Group Chat"}
      />

      <InfoRow
        icon={<Calendar size={15} />}
        label="Created"
        value={formatDate(chat.createdAt)}
      />

      <InfoRow
        icon={<Clock size={15} />}
        label="Last activity"
        value={
          chat.lastMessageAt
            ? `${formatDate(chat.lastMessageAt)} at ${formatTime(chat.lastMessageAt)}`
            : "No messages yet"
        }
      />
    </div>
  );
};

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}

const InfoRow = ({ icon, label, value, mono, truncate }: InfoRowProps) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p
        className={cn(
          "text-sm text-foreground",
          mono && "font-mono text-xs",
          truncate && "truncate"
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  </div>
);

export default ConversationInfo;
