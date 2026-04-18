import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  handleGoogleCallback: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ReplyingTo {
  messageId: string;
  content: string;
  senderName: string;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<
    string,
    {
      items: Message[];
      hasMore: boolean; // infinite-scroll
      nextCursor?: string | null; // phân trang
    }
  >;
  activeConversationId: string | null;
  convoLoading: boolean;
  isFetchingMore: Record<string, boolean>;
  messageLoading: boolean;
  loading: boolean;
  replyingTo: ReplyingTo | null;
  reset: () => void;

  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
    replyTo?: { messageId: string },
    forwardedFrom?: { originalSenderId: string; originalSenderName: string }
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
    replyTo?: { messageId: string },
    forwardedFrom?: { originalSenderId: string; originalSenderName: string }
  ) => Promise<void>;
  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: Partial<Conversation> & { _id: string }) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;
  muteConversation: (convoId: string, durationMs: number | null) => Promise<void>;
  unmuteConversation: (convoId: string) => Promise<void>;
  blockUser: (convoId: string) => Promise<void>;
  unblockUser: (convoId: string) => Promise<void>;
  deleteConversation: (convoId: string) => Promise<void>;
  setReplyingTo: (reply: ReplyingTo | null) => void;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  unsendMessage: (messageId: string) => Promise<void>;
  removeMessage: (messageId: string) => Promise<void>;
  forwardMessage: (messageId: string, conversationId: string) => Promise<void>;
  updateMessageReactions: (messageId: string, conversationId: string, reactions: Message["reactions"]) => void;
  markMessageUnsent: (messageId: string, conversationId: string) => void;
}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;
}

export interface UserState {
  updateAvatarUrl: (formData: FormData) => Promise<void>;
}

