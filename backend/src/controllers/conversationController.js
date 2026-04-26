import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Group name and member list are required" });
    }

    let conversation;

    if (type === "direct") {
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type is invalid" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }

    return res.status(201).json({ conversation: formatted });
  } catch (error) {
    console.error("Error when creating conversation", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
      deletedFor: { $ne: userId },
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => {
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),
        unreadCounts: convo.unreadCounts || {},
        mutedBy: Object.fromEntries(convo.mutedBy || []),
        seenBy: Object.fromEntries(convo.seenBy || []),
        blockedBy: (convo.blockedBy || []).map((id) => id.toString()),
        nicknames: Object.fromEntries(convo.nicknames || []),
        pinnedMessages: (convo.pinnedMessages || []).map((id) => id.toString()),
        quickReactEmoji: convo.quickReactEmoji || "👍",
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Error when getting conversations", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Error when getting messages", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { durationMs } = req.body;
    const userId = req.user._id.toString();
    const expiry = durationMs === null ? null : new Date(Date.now() + durationMs);
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`mutedBy.${userId}`]: expiry },
    });
    return res.status(200).json({ message: "Muted" });
  } catch (error) {
    console.error("Error when muting conversation", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unmuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();
    await Conversation.findByIdAndUpdate(conversationId, {
      $unset: { [`mutedBy.${userId}`]: "" },
    });
    return res.status(200).json({ message: "Unmuted" });
  } catch (error) {
    console.error("Error when unmuting conversation", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { blockedBy: userId } },
      { new: true }
    );
    io.to(conversationId).emit("conversation-updated", {
      conversationId,
      blockedBy: (updated.blockedBy || []).map((id) => id.toString()),
    });
    return res.status(200).json({ message: "Blocked" });
  } catch (error) {
    console.error("Error when blocking user", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { blockedBy: userId } },
      { new: true }
    );
    io.to(conversationId).emit("conversation-updated", {
      conversationId,
      blockedBy: (updated.blockedBy || []).map((id) => id.toString()),
    });
    return res.status(200).json({ message: "Unblocked" });
  } catch (error) {
    console.error("Error when unblocking user", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteConversationForUser = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { deletedFor: userId },
    });
    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("Error when deleting conversation for user", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Error when fetching conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation doesn't exist" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "There is no message to mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender doesn't need to mark as seen" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          [`seenBy.${userId}`]: last._id,
          [`unreadCounts.${userId}`]: 0,
        },
      },
      {
        new: true,
      },
    ).populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });

    const seenByObj = Object.fromEntries(updated?.seenBy || []);

    const participantsMap = {};
    for (const p of updated?.participants || []) {
      if (p.userId) {
        participantsMap[p.userId._id.toString()] = {
          _id: p.userId._id,
          displayName: p.userId.displayName,
          avatarUrl: p.userId.avatarUrl ?? null,
        };
      }
    }

    io.to(conversationId).emit("read-message", {
      conversation: {
        _id: updated._id,
        lastMessageAt: updated.lastMessageAt,
        unreadCounts: updated.unreadCounts,
        seenBy: seenByObj,
      },
      participants: participantsMap,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: seenByObj,
      myUnreadCount: updated?.unreadCounts?.get?.(userId) || 0,
    });
  } catch (error) {
    console.error("Error when marking as seen", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q, limit = 20, cursor } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const query = {
      conversationId,
      content: { $regex: q.trim(), $options: "i" },
      deletedAt: null,
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;
    if (messages.length > Number(limit)) {
      nextCursor = messages[messages.length - 1].createdAt.toISOString();
      messages.pop();
    }

    const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
    const users = await User.find({ _id: { $in: senderIds } }).select("displayName avatarUrl");
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const results = messages.map((m) => ({
      _id: m._id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: userMap[m.senderId.toString()]?.displayName || "Unknown",
      senderAvatar: userMap[m.senderId.toString()]?.avatarUrl || null,
      content: m.content,
      createdAt: m.createdAt,
    }));

    return res.status(200).json({ messages: results, nextCursor });
  } catch (error) {
    console.error("Error when searching messages", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if ((conversation.pinnedMessages || []).length >= 50) {
      return res.status(400).json({ message: "Maximum 50 pinned messages reached" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { pinnedMessages: messageId } },
      { new: true }
    );

    const pinnedIds = (updated.pinnedMessages || []).map((id) => id.toString());
    io.to(conversationId).emit("conversation-updated", { conversationId, pinnedMessages: pinnedIds });

    return res.status(200).json({ message: "Pinned", pinnedMessages: pinnedIds });
  } catch (error) {
    console.error("Error when pinning message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { pinnedMessages: messageId } },
      { new: true }
    );

    const pinnedIds = (updated.pinnedMessages || []).map((id) => id.toString());
    io.to(conversationId).emit("conversation-updated", { conversationId, pinnedMessages: pinnedIds });

    return res.status(200).json({ message: "Unpinned", pinnedMessages: pinnedIds });
  } catch (error) {
    console.error("Error when unpinning message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const pinnedIds = conversation.pinnedMessages || [];
    if (pinnedIds.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    const messages = await Message.find({ _id: { $in: pinnedIds }, deletedAt: null })
      .sort({ createdAt: -1 });

    const senderIds = [...new Set(messages.map((m) => m.senderId.toString()))];
    const users = await User.find({ _id: { $in: senderIds } }).select("displayName avatarUrl");
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const results = messages.map((m) => ({
      _id: m._id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: userMap[m.senderId.toString()]?.displayName || "Unknown",
      senderAvatar: userMap[m.senderId.toString()]?.avatarUrl || null,
      content: m.content,
      imgUrl: m.imgUrl || null,
      createdAt: m.createdAt,
    }));

    return res.status(200).json({ messages: results });
  } catch (error) {
    console.error("Error when getting pinned messages", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setNickname = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, nickname } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    let updated;
    if (!nickname || nickname.trim() === "") {
      updated = await Conversation.findByIdAndUpdate(
        conversationId,
        { $unset: { [`nicknames.${userId}`]: "" } },
        { new: true }
      );
    } else {
      updated = await Conversation.findByIdAndUpdate(
        conversationId,
        { $set: { [`nicknames.${userId}`]: nickname.trim() } },
        { new: true }
      );
    }

    const nicknames = Object.fromEntries(updated.nicknames || []);
    io.to(conversationId).emit("conversation-updated", { conversationId, nicknames });

    return res.status(200).json({ message: "Nickname updated", nicknames });
  } catch (error) {
    console.error("Error when setting nickname", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setQuickReactEmoji = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "emoji is required" });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { quickReactEmoji: emoji },
    });

    io.to(conversationId).emit("conversation-updated", { conversationId, quickReactEmoji: emoji });

    return res.status(200).json({ message: "Quick react emoji updated" });
  } catch (error) {
    console.error("Error when setting quick react emoji", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroupName = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    conversation.group.name = name.trim();
    await conversation.save();

    io.to(conversationId).emit("conversation-updated", {
      conversationId,
      group: { name: conversation.group.name, createdBy: conversation.group.createdBy },
    });

    return res.status(200).json({ message: "Group name updated" });
  } catch (error) {
    console.error("Error when updating group name", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    const alreadyMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    conversation.participants.push({ userId, joinedAt: new Date() });
    await conversation.save();

    await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    io.to(conversationId).emit("conversation-updated", { conversationId, participants });

    const formatted = { ...conversation.toObject(), participants };
    io.to(userId).emit("new-group", formatted);

    return res.status(200).json({ message: "Member added", participants });
  } catch (error) {
    console.error("Error when adding member", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    if (conversation.participants.length <= 1) {
      return res.status(400).json({ message: "Cannot leave — you are the last member" });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId.toString()
    );
    await conversation.save();

    await conversation.populate({
      path: "participants.userId",
      select: "displayName avatarUrl",
    });

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    io.to(conversationId).emit("conversation-updated", { conversationId, participants });

    return res.status(200).json({ message: "Left group" });
  } catch (error) {
    console.error("Error when leaving group", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMedia = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { type = "images", limit = 20, cursor } = req.query;

    const query = {
      conversationId,
      deletedAt: null,
    };

    if (type === "images") {
      query.imgUrl = { $ne: null, $exists: true };
    } else {
      query.imgUrl = { $ne: null, $exists: true };
    }

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1)
      .select("imgUrl senderId createdAt");

    let nextCursor = null;
    if (messages.length > Number(limit)) {
      nextCursor = messages[messages.length - 1].createdAt.toISOString();
      messages.pop();
    }

    const results = messages.map((m) => ({
      _id: m._id,
      imgUrl: m.imgUrl,
      senderId: m.senderId,
      createdAt: m.createdAt,
    }));

    return res.status(200).json({ media: results, nextCursor });
  } catch (error) {
    console.error("Error when getting media", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};