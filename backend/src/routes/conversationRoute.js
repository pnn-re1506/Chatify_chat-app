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
  searchMessages,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  setNickname,
  setQuickReactEmoji,
  updateGroupName,
  addMember,
  leaveGroup,
  getMedia,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages/search", searchMessages);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.patch("/:conversationId/mute", muteConversation);
router.patch("/:conversationId/unmute", unmuteConversation);
router.patch("/:conversationId/block", blockUser);
router.patch("/:conversationId/unblock", unblockUser);
router.patch("/:conversationId/delete", deleteConversationForUser);
router.get("/:conversationId/pinned", getPinnedMessages);
router.patch("/:conversationId/pin", pinMessage);
router.patch("/:conversationId/unpin", unpinMessage);
router.patch("/:conversationId/nickname", setNickname);
router.patch("/:conversationId/quick-react", setQuickReactEmoji);
router.patch("/:conversationId/group-name", updateGroupName);
router.patch("/:conversationId/add-member", addMember);
router.patch("/:conversationId/leave", leaveGroup);
router.get("/:conversationId/media", getMedia);

export default router;