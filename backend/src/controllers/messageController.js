import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, replyTo, forwardedFrom } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content) {
      return res.status(400).json({ message: "Lack of content" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      return res.status(403).json({ message: "This conversation is blocked" });
    }

    const messageData = {
      conversationId: conversation._id,
      senderId,
      content,
    };

    if (replyTo?.messageId) {
      const original = await Message.findById(replyTo.messageId);
      if (original) {
        const originalSender = await User.findById(original.senderId).select("displayName");
        messageData.replyTo = {
          messageId: original._id,
          content: original.content?.substring(0, 200) || "",
          senderId: original.senderId,
          senderName: originalSender?.displayName || "Unknown",
        };
      }
    }

    if (forwardedFrom) {
      messageData.forwardedFrom = forwardedFrom;
    }

    const message = await Message.create(messageData);

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error sending direct message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, replyTo, forwardedFrom } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Lack of content");
    }

    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      return res.status(403).json({ message: "This conversation is blocked" });
    }

    const messageData = {
      conversationId,
      senderId,
      content,
    };

    if (replyTo?.messageId) {
      const original = await Message.findById(replyTo.messageId);
      if (original) {
        const originalSender = await User.findById(original.senderId).select("displayName");
        messageData.replyTo = {
          messageId: original._id,
          content: original.content?.substring(0, 200) || "",
          senderId: original.senderId,
          senderName: originalSender?.displayName || "Unknown",
        };
      }
    }

    if (forwardedFrom) {
      messageData.forwardedFrom = forwardedFrom;
    }

    const message = await Message.create(messageData);

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error sending group message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === userId.toString()
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    io.to(message.conversationId.toString()).emit("message-reacted", {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });

    return res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Error toggling reaction", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const unsendMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only unsend your own messages" });
    }

    message.content = null;
    message.imgUrl = null;
    message.deletedAt = new Date();
    message.reactions = [];
    await message.save();

    io.to(message.conversationId.toString()).emit("message-unsent", {
      messageId: message._id,
      conversationId: message.conversationId,
    });

    return res.status(200).json({ message: "Message unsent" });
  } catch (error) {
    console.error("Error unsending message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.status(200).json({ message: "Message removed for you" });
  } catch (error) {
    console.error("Error removing message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { messageId, conversationId } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const originalSender = await User.findById(message.senderId).select("displayName");
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId: userId,
      content: message.content,
      forwardedFrom: {
        originalSenderId: message.senderId,
        originalSenderName: originalSender?.displayName || "Unknown",
      },
    });

    updateConversationAfterCreateMessage(conversation, newMessage, userId);

    await conversation.save();

    emitNewMessage(io, conversation, newMessage);

    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error("Error forwarding message", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};