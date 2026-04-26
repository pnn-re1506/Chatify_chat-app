import api from "@/lib/axios";
import type { ConversationResponse, Message, SearchResult, PinnedMessage, MediaItem } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 20;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    replyTo?: { messageId: string },
    forwardedFrom?: { originalSenderId: string; originalSenderName: string }
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      replyTo,
      forwardedFrom,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    replyTo?: { messageId: string },
    forwardedFrom?: { originalSenderId: string; originalSenderName: string }
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      replyTo,
      forwardedFrom,
    });
    return res.data.message;
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  async muteConversation(convoId: string, durationMs: number | null) {
    await api.patch(`/conversations/${convoId}/mute`, { durationMs });
  },

  async unmuteConversation(convoId: string) {
    await api.patch(`/conversations/${convoId}/unmute`);
  },

  async blockUser(convoId: string) {
    await api.patch(`/conversations/${convoId}/block`);
  },

  async unblockUser(convoId: string) {
    await api.patch(`/conversations/${convoId}/unblock`);
  },

  async deleteConversation(convoId: string) {
    await api.patch(`/conversations/${convoId}/delete`);
  },

  async getUserProfile(userId: string) {
    const res = await api.get(`/users/${userId}/profile`);
    return res.data.user as { _id: string; displayName: string; avatarUrl?: string; bio?: string };
  },

  async toggleReaction(messageId: string, emoji: string) {
    const res = await api.patch(`/messages/${messageId}/react`, { emoji });
    return res.data.reactions;
  },

  async unsendMessage(messageId: string) {
    const res = await api.delete(`/messages/${messageId}/unsend`);
    return res.data;
  },

  async removeMessage(messageId: string) {
    const res = await api.patch(`/messages/${messageId}/remove`);
    return res.data;
  },

  async forwardMessage(messageId: string, conversationId: string) {
    const res = await api.post("/messages/forward", { messageId, conversationId });
    return res.data.message;
  },

  async searchMessages(convoId: string, query: string, limit = 20, cursor?: string) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    if (cursor) params.append("cursor", cursor);
    const res = await api.get(`/conversations/${convoId}/messages/search?${params}`);
    return res.data as { messages: SearchResult[]; nextCursor: string | null };
  },

  async getPinnedMessages(convoId: string) {
    const res = await api.get(`/conversations/${convoId}/pinned`);
    return res.data.messages as PinnedMessage[];
  },

  async pinMessage(convoId: string, messageId: string) {
    const res = await api.patch(`/conversations/${convoId}/pin`, { messageId });
    return res.data.pinnedMessages as string[];
  },

  async unpinMessage(convoId: string, messageId: string) {
    const res = await api.patch(`/conversations/${convoId}/unpin`, { messageId });
    return res.data.pinnedMessages as string[];
  },

  async setNickname(convoId: string, userId: string, nickname: string) {
    const res = await api.patch(`/conversations/${convoId}/nickname`, { userId, nickname });
    return res.data.nicknames as Record<string, string>;
  },

  async setQuickReactEmoji(convoId: string, emoji: string) {
    await api.patch(`/conversations/${convoId}/quick-react`, { emoji });
  },

  async updateGroupName(convoId: string, name: string) {
    await api.patch(`/conversations/${convoId}/group-name`, { name });
  },

  async addMember(convoId: string, userId: string) {
    const res = await api.patch(`/conversations/${convoId}/add-member`, { userId });
    return res.data.participants;
  },

  async leaveGroup(convoId: string) {
    await api.patch(`/conversations/${convoId}/leave`);
  },

  async getMedia(convoId: string, type: "images" | "files" = "images", limit = 20, cursor?: string) {
    const params = new URLSearchParams({ type, limit: String(limit) });
    if (cursor) params.append("cursor", cursor);
    const res = await api.get(`/conversations/${convoId}/media?${params}`);
    return res.data as { media: MediaItem[]; nextCursor: string | null };
  },
};