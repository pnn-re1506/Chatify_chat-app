import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  getUserProfile,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.get("/:userId/profile", getUserProfile);

export default router;