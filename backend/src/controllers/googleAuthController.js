import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

// Lazy singleton — created on first request, AFTER dotenv.config() has run.
// ESM imports are evaluated before module-level code in server.js,
// so process.env vars are undefined at import time.
let _oAuth2Client = null;
function getOAuth2Client() {
    if (!_oAuth2Client) {
        _oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_CALLBACK_URL
        );
    }
    return _oAuth2Client;
}

/**
 * GET /api/auth/google
 * Generates a state parameter for CSRF protection, stores it in a HttpOnly cookie,
 * then redirects the user to Google's OAuth 2.0 authorization endpoint.
 */
export const googleLogin = (req, res) => {
    try {
        // Generate cryptographically random state for CSRF protection
        const state = crypto.randomBytes(32).toString("hex");

        // Store state in HttpOnly cookie so we can validate on callback
        res.cookie("oauth_state", state, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 10 * 60 * 1000, // 10 minutes — generous for slow networks
        });

        // Build Google authorization URL
        const authUrl = getOAuth2Client().generateAuthUrl({
            access_type: "offline",
            scope: ["openid", "email", "profile"],
            state,
            prompt: "select_account", // always show account picker
        });

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Error in googleLogin:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/auth/google/callback
 * Handles callback from Google:
 *  1. Validates state parameter (CSRF protection)
 *  2. Exchanges authorization code for tokens
 *  3. Verifies ID token and extracts user profile
 *  4. Find-or-create user in database (auto-links if email matches)
 *  5. Issues JWT + refresh token (same as existing signIn)
 *  6. Redirects to frontend with access token
 */
export const googleCallback = async (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    try {
        const { code, state, error: googleError } = req.query;

        // Handle user cancellation or Google-side errors
        if (googleError) {
            console.error("Google OAuth error:", googleError);
            return res.redirect(
                `${frontendUrl}/signin?error=${encodeURIComponent(googleError)}`
            );
        }

        // ---- CSRF Validation ----
        const savedState = req.cookies?.oauth_state;
        if (!state || !savedState || state !== savedState) {
            console.error("State mismatch — potential CSRF attack");
            return res.redirect(`${frontendUrl}/signin?error=csrf_failed`);
        }

        // Clear the state cookie — single use
        res.clearCookie("oauth_state");

        if (!code) {
            return res.redirect(`${frontendUrl}/signin?error=no_code`);
        }

        // ---- Token Exchange ----
        const { tokens } = await getOAuth2Client().getToken(code);

        if (!tokens.id_token) {
            return res.redirect(`${frontendUrl}/signin?error=no_id_token`);
        }

        // ---- Verify ID Token ----
        const ticket = await getOAuth2Client().verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.redirect(`${frontendUrl}/signin?error=no_email`);
        }

        // ---- Find or Create User ----
        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if a local account with the same email already exists
            user = await User.findOne({ email: email.toLowerCase() });

            if (user) {
                // AUTO-LINK: existing local account gets Google ID attached
                user.googleId = googleId;
                if (!user.avatarUrl && picture) {
                    user.avatarUrl = picture;
                }
                await user.save();
            } else {
                // CREATE new user from Google profile
                const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
                let username = baseUsername;

                // Ensure username uniqueness
                const existingUsername = await User.findOne({ username });
                if (existingUsername) {
                    const suffix = crypto.randomBytes(2).toString("hex");
                    username = `${baseUsername}_${suffix}`;
                }

                user = await User.create({
                    username,
                    email: email.toLowerCase(),
                    displayName: name || email.split("@")[0],
                    googleId,
                    authProvider: "google",
                    avatarUrl: picture || undefined,
                });
            }
        }

        // ---- Issue Session (identical to existing signIn logic) ----
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        const refreshToken = crypto.randomBytes(64).toString("hex");

        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: REFRESH_TOKEN_TTL,
        });

        // ---- Redirect to frontend with access token ----
        return res.redirect(
            `${frontendUrl}/auth/google/callback?accessToken=${encodeURIComponent(accessToken)}`
        );
    } catch (error) {
        console.error("Error in googleCallback:", error);
        return res.redirect(`${frontendUrl}/signin?error=server_error`);
    }
};
