import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  toggleReaction,
  unsendMessage,
  removeMessage,
  forwardMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.patch("/:messageId/react", toggleReaction);
router.delete("/:messageId/unsend", unsendMessage);
router.patch("/:messageId/remove", removeMessage);
router.post("/forward", forwardMessage);

export default router;