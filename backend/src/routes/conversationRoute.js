import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  muteConversation,
  unmuteConversation,
  blockUser,
  unblockUser,
  deleteConversationForUser,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.patch("/:conversationId/mute", muteConversation);
router.patch("/:conversationId/unmute", unmuteConversation);
router.patch("/:conversationId/block", blockUser);
router.patch("/:conversationId/unblock", unblockUser);
router.patch("/:conversationId/delete", deleteConversationForUser);

export default router;