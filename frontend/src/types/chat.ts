export interface Participant {
  _id: string;
  displayName: string;
  avatarUrl?: string | null;
  joinedAt: string;
}

export interface SeenUser {
  _id: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface Group {
  name: string;
  createdBy: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  group: Group;
  participants: Participant[];
  lastMessageAt: string;
  seenBy: Record<string, string>;
  lastMessage: LastMessage | null;
  unreadCounts: Record<string, number>; // key = userId, value = unread count
  mutedBy?: Record<string, string | null>; // userId -> ISO expiry date or null (indefinite)
  blockedBy?: string[]; // userIds who have blocked in this conversation
  pinnedMessages?: string[];
  nicknames?: Record<string, string>;
  quickReactEmoji?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationResponse {
  conversations: Conversation[];
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface ReplyTo {
  messageId: string;
  content: string;
  senderId: string;
  senderName: string;
}

export interface ForwardedFrom {
  originalSenderId: string;
  originalSenderName: string;
}

export interface SearchResult {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface PinnedMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  imgUrl?: string | null;
  createdAt: string;
}

export interface MediaItem {
  _id: string;
  imgUrl: string;
  senderId: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  imgUrl?: string | null;
  updatedAt?: string | null;
  createdAt: string;
  isOwn?: boolean;
  reactions?: Reaction[];
  replyTo?: ReplyTo | null;
  forwardedFrom?: ForwardedFrom | null;
  deletedAt?: string | null;
  deletedFor?: string[];
}
