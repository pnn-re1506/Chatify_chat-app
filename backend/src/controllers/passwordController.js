import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { sendOTPEmail } from "../services/emailService.js";

const OTP_TTL = 10 * 60 * 1000;        // 10 minutes
const OTP_COOLDOWN = 60 * 1000;         // 60 seconds
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_TTL = "15m";

/**
 * POST /auth/forgot-password
 * Body: { email }
 *
 * 3 cases:
 * 1. Email not found        → generic 200 (prevent enumeration)
 * 2. Google-only account     → 200 with googleOnly flag
 * 3. Local password account  → generate OTP, send email, 200
 */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const GENERIC_MSG = "If this email is registered, you will receive a reset code shortly.";

        // Check if user with this email exists
        const user = await User.findOne({ email: normalizedEmail });

        // Case 1: Email not found — return generic 200 (no email sent)
        if (!user) {
            return res.status(200).json({ message: GENERIC_MSG });
        }

        // Case 2: Google-only account (no local password)
        if (user.authProvider === "google" && !user.hashedPassword) {
            return res.status(200).json({
                message: "This account uses Google login. Please sign in with Google instead.",
                googleOnly: true,
            });
        }

        // Case 3: Local password account — generate and send OTP

        // Check cooldown — prevent resend within 60 seconds
        const existingOTP = await OTP.findOne({ email: normalizedEmail });
        if (existingOTP) {
            const timeSinceCreated = Date.now() - new Date(existingOTP.createdAt).getTime();
            if (timeSinceCreated < OTP_COOLDOWN) {
                const secondsLeft = Math.ceil((OTP_COOLDOWN - timeSinceCreated) / 1000);
                return res.status(429).json({
                    message: `Please wait ${secondsLeft} seconds before requesting a new OTP.`,
                    cooldownSeconds: secondsLeft,
                });
            }
        }

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email: normalizedEmail });

        // Generate 6-digit OTP
        const rawOTP = crypto.randomInt(100000, 999999).toString();

        // Hash OTP before storing
        const hashedOTP = await bcrypt.hash(rawOTP, 10);

        // Save to DB
        await OTP.create({
            email: normalizedEmail,
            otp: hashedOTP,
            expiresAt: new Date(Date.now() + OTP_TTL),
        });

        // Send OTP email
        await sendOTPEmail(email, rawOTP);

        return res.status(200).json({ message: GENERIC_MSG });

    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({ email: email.toLowerCase().trim() });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Check expiry
        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Check attempt limit
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({
                message: "Too many failed attempts. Please request a new OTP.",
                expired: true,
            });
        }

        // Compare OTP
        const isValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isValid) {
            // Increment attempts
            otpRecord.attempts += 1;
            await otpRecord.save();

            const attemptsLeft = MAX_OTP_ATTEMPTS - otpRecord.attempts;
            return res.status(400).json({
                message: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`,
                attemptsLeft,
            });
        }

        // OTP is valid — delete it (single-use)
        await OTP.deleteOne({ _id: otpRecord._id });

        // Find user to get their ID
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        // Generate a short-lived reset token
        const resetToken = jwt.sign(
            { userId: user._id, purpose: "password-reset" },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: RESET_TOKEN_TTL }
        );

        return res.status(200).json({
            message: "OTP verified successfully.",
            resetToken,
        });

    } catch (error) {
        console.error("Error in verifyOTP:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /auth/reset-password
 * Body: { resetToken, newPassword }
 */
export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Reset token and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.ACCESS_TOKEN_SECRET);
        } catch {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        // Ensure token was issued for password reset
        if (decoded.purpose !== "password-reset") {
            return res.status(400).json({ message: "Invalid reset token." });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password
        const user = await User.findByIdAndUpdate(decoded.userId, {
            hashedPassword,
        });

        if (!user) {
            return res.status(400).json({ message: "User not found." });
        }

        return res.status(200).json({ message: "Password updated successfully." });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
