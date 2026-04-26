import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { playNotificationSound } from "@/lib/notificationSound";

const baseURL = import.meta.env.VITE_SOCKET_URL;
export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // avoid creating multiple sockets

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Connected to socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);

      const { user } = useAuthStore.getState();
      const isOwn = message.senderId === user?._id;
      const cachedConvo = useChatStore
        .getState()
        .conversations.find((c) => c._id === message.conversationId);
      const muteExpiry = cachedConvo?.mutedBy?.[user?._id ?? ""];
      const isMuted =
        muteExpiry !== undefined &&
        (muteExpiry === null || new Date(muteExpiry) > new Date());

      if (!isOwn && !isMuted) {
        playNotificationSound();
      }
    });

    // read message
    socket.on("read-message", ({ conversation }) => {
      const updated = {
        _id: conversation._id,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // reaction toggled
    socket.on("message-reacted", ({ messageId, conversationId, reactions }) => {
      useChatStore.getState().updateMessageReactions(messageId, conversationId, reactions);
    });

    // message unsent
    socket.on("message-unsent", ({ messageId, conversationId }) => {
      useChatStore.getState().markMessageUnsent(messageId, conversationId);
    });

    // conversation updated (block/unblock, pin, nickname, emoji, group, members)
    socket.on("conversation-updated", (data) => {
      const { conversationId, ...fields } = data;
      useChatStore.getState().updateConversation({ _id: conversationId, ...fields });
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));