# Forgot Password Feature — Update Summary

## Date: 2026-03-31

## Overview

Updated the Forgot Password feature to prevent email enumeration and handle Google OAuth-only accounts gracefully.

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/src/controllers/passwordController.js` | Rewrote `forgotPassword` handler with 3 distinct cases |

**`forgotPassword` now handles 3 cases:**

1. **Email not found** → Returns generic `200`: *"If this email is registered, you will receive a reset code shortly."* — prevents email enumeration (previously returned `404` which leaked whether an email was registered).
2. **Email found + local password** → Generates OTP, sends via Resend, returns same generic `200`.
3. **Email found + Google OAuth only** (`authProvider === "google"` AND no `hashedPassword`) → Returns `200` with `{ googleOnly: true }` and message: *"This account uses Google login. Please sign in with Google instead."*

`verifyOTP` and `resetPassword` — **no changes needed**, already correct.

---

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/auth/forgot-password-form.tsx` | Added `isGoogleOnly` state; dynamic header title/subtitle |
| `frontend/src/components/auth/forgot-password/request-otp-form.tsx` | Full rewrite to handle 3 response cases |
| `frontend/src/components/auth/forgot-password/verify-otp-form.tsx` | No changes needed |
| `frontend/src/components/auth/forgot-password/reset-password-form.tsx` | No changes needed |

**`request-otp-form.tsx` behavior:**
- On submit, calls `POST /auth/forgot-password`
- If `googleOnly: true` in response → shows amber warning message + "Sign in with Google instead" button (matches Google button style from `signin-form.tsx`)
- Otherwise → shows green success message, then auto-advances to OTP step after 1.5s
- All errors shown inline (red text under input)
- Button disabled after success to prevent double-submit

**`forgot-password-form.tsx` behavior:**
- Header dynamically switches title to "Google Account Detected" and subtitle to "This account is linked to Google sign-in" when `isGoogleOnly` is true
- Resets `isGoogleOnly` flag when user changes email or navigates back

---

## Security Notes

- The generic success message intentionally does **not** reveal whether an email exists in the database
- The only case that reveals account info is the Google-only case, which is acceptable UX since the user needs to know they should use a different login method
- OTP cooldown (60s) and attempt limit (5 tries) remain unchanged
- Reset token is JWT with 15-minute expiry
