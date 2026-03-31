import express from "express";
import { signUp } from "../controllers/authController.js";
import { signIn } from "../controllers/authController.js";
import { signOut } from "../controllers/authController.js";
import { refreshToken } from "../controllers/authController.js";
import { googleLogin, googleCallback } from "../controllers/googleAuthController.js";
import { forgotPassword, verifyOTP, resetPassword } from "../controllers/passwordController.js";

const router = express.Router();

router.post("/signup",signUp);

router.post("/signin",signIn);

router.post("/signout",signOut);

router.post("/refresh",refreshToken);

// Google OAuth routes
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

export default router;
