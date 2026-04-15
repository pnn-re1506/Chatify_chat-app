import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

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
    conversationId?: string
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
    });

    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
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
};