import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      isFetchingMore: {},
      messageLoading: false,
      loading: false,
      replyingTo: null,

      setActiveConversation: (id) => set({
        activeConversationId: id,
        replyingTo: null,
      }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          isFetchingMore: {},
          messageLoading: false,
          replyingTo: null,
        });
      },
      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Error when fetchConversations:", error);
          set({ convoLoading: false });
        }
      },
      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages, isFetchingMore } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;
        if (!convoId) return;

        // Prevent duplicate fetches for the same conversation
        if (isFetchingMore[convoId]) return;

        const current = messages?.[convoId];
        const nextCursor =
          current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        const isInitialLoad = !current || current.items.length === 0;

        // Only show full skeleton for initial page load
        if (isInitialLoad) {
          set({ messageLoading: true });
        }

        set((state) => ({
          isFetchingMore: { ...state.isFetchingMore, [convoId]: true },
        }));

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(
            convoId,
            nextCursor
          );

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when fetchMessages:", error);
        } finally {
          set((state) => ({
            messageLoading: false,
            isFetchingMore: { ...state.isFetchingMore, [convoId]: false },
          }));
        }
      },
      sendDirectMessage: async (recipientId, content, imgUrl, replyTo, forwardedFrom) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imgUrl,
            activeConversationId || undefined,
            replyTo,
            forwardedFrom
          );
          set((state) => ({
            replyingTo: null,
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: {} } : c
            ),
          }));
        } catch (error) {
          console.error("Error when send direct message", error);
        }
      },
      sendGroupMessage: async (conversationId, content, imgUrl, replyTo, forwardedFrom) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imgUrl, replyTo, forwardedFrom);
          set((state) => ({
            replyingTo: null,
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: {} } : c
            ),
          }));
        } catch (error) {
          console.error("Error when send group message", error);
        }
      },
      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];

          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: state.messages[convoId].hasMore,
                  nextCursor: state.messages[convoId].nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when add message:", error);
        }
      },
      updateConversation: (conversation) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c._id === conversation._id ? { ...c, ...conversation } : c
          ),
        }));
      },
      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) {
            return;
          }

          const convo = conversations.find((c) => c._id === activeConversationId);

          if (!convo) {
            return;
          }

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                  ...c,
                  unreadCounts: {
                    ...c.unreadCounts,
                    [user._id]: 0,
                  },
                }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when markAsSeen in store", error);
        }
      },
      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists
              ? state.conversations
              : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },
      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(
            type,
            name,
            memberIds
          );

          get().addConvo(conversation);

          useSocketStore
            .getState()
            .socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Error when createConversation in store", error);
        } finally {
          set({ loading: false });
        }
      },
      muteConversation: async (convoId, durationMs) => {
        try {
          await chatService.muteConversation(convoId, durationMs);
          const { user } = useAuthStore.getState();
          if (!user) return;
          const expiry =
            durationMs === null ? null : new Date(Date.now() + durationMs).toISOString();
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === convoId
                ? { ...c, mutedBy: { ...c.mutedBy, [user._id]: expiry } }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when muting conversation", error);
        }
      },
      unmuteConversation: async (convoId) => {
        try {
          await chatService.unmuteConversation(convoId);
          const { user } = useAuthStore.getState();
          if (!user) return;
          set((state) => ({
            conversations: state.conversations.map((c) => {
              if (c._id !== convoId) return c;
              const mutedBy = { ...c.mutedBy };
              delete mutedBy[user._id];
              return { ...c, mutedBy };
            }),
          }));
        } catch (error) {
          console.error("Error when unmuting conversation", error);
        }
      },
      blockUser: async (convoId) => {
        try {
          await chatService.blockUser(convoId);
          const { user } = useAuthStore.getState();
          if (!user) return;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === convoId
                ? { ...c, blockedBy: [...(c.blockedBy ?? []), user._id] }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when blocking user", error);
        }
      },
      unblockUser: async (convoId) => {
        try {
          await chatService.unblockUser(convoId);
          const { user } = useAuthStore.getState();
          if (!user) return;
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === convoId
                ? {
                  ...c,
                  blockedBy: (c.blockedBy ?? []).filter((id) => id !== user._id),
                }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error when unblocking user", error);
        }
      },
      deleteConversation: async (convoId) => {
        try {
          await chatService.deleteConversation(convoId);
          set((state) => ({
            conversations: state.conversations.filter((c) => c._id !== convoId),
            activeConversationId:
              state.activeConversationId === convoId
                ? null
                : state.activeConversationId,
          }));
        } catch (error) {
          console.error("Error when deleting conversation", error);
        }
      },
      setReplyingTo: (reply) => set({ replyingTo: reply }),
      toggleReaction: async (messageId, emoji) => {
        try {
          await chatService.toggleReaction(messageId, emoji);
        } catch (error) {
          console.error("Error when toggling reaction", error);
        }
      },
      unsendMessage: async (messageId) => {
        try {
          await chatService.unsendMessage(messageId);
        } catch (error) {
          console.error("Error when unsending message", error);
        }
      },
      removeMessage: async (messageId) => {
        try {
          await chatService.removeMessage(messageId);
          const { activeConversationId } = get();
          if (!activeConversationId) return;
          set((state) => {
            const convoMessages = state.messages[activeConversationId];
            if (!convoMessages) return state;
            return {
              messages: {
                ...state.messages,
                [activeConversationId]: {
                  ...convoMessages,
                  items: convoMessages.items.filter((m) => m._id !== messageId),
                },
              },
            };
          });
        } catch (error) {
          console.error("Error when removing message", error);
        }
      },
      forwardMessage: async (messageId, conversationId) => {
        try {
          await chatService.forwardMessage(messageId, conversationId);
        } catch (error) {
          console.error("Error when forwarding message", error);
        }
      },
      updateMessageReactions: (messageId, conversationId, reactions) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return state;
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: convoMessages.items.map((m) =>
                  m._id === messageId ? { ...m, reactions } : m
                ),
              },
            },
          };
        });
      },
      markMessageUnsent: (messageId, conversationId) => {
        set((state) => {
          const convoMessages = state.messages[conversationId];
          if (!convoMessages) return state;
          return {
            messages: {
              ...state.messages,
              [conversationId]: {
                ...convoMessages,
                items: convoMessages.items.map((m) =>
                  m._id === messageId
                    ? { ...m, content: null, imgUrl: null, deletedAt: new Date().toISOString(), reactions: [] }
                    : m
                ),
              },
            },
          };
        });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);