# Forgot Password — Feature Summary

## Overview

A complete forgot password flow using **Resend** for OTP email delivery, with a multi-step UI on the frontend. The user can reset their password by verifying their identity through a 6-digit OTP sent to their registered email.

## User Flow

```
Sign In Page → Click "Forgot Password?"
    → Step 1: Enter registered email → Click "Send OTP"
    → Step 2: Enter 6-digit OTP from email → Auto-verify
    → Step 3: Set new password + confirm → Click "Reset Password"
    → Redirect to Sign In with success message
```

---

## Files Created

### Backend

| File | Purpose |
|------|---------|
| `backend/src/models/OTP.js` | Mongoose model for OTP records (email, hashed OTP, attempts, expiry) with TTL auto-cleanup |
| `backend/src/services/emailService.js` | Resend-powered email service with branded HTML template for OTP delivery |
| `backend/src/controllers/passwordController.js` | Three endpoints: `forgotPassword`, `verifyOTP`, `resetPassword` |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/pages/ForgotPasswordPage.tsx` | Page wrapper with same layout as sign-in/sign-up |
| `frontend/src/components/auth/forgot-password-form.tsx` | Multi-step form (email → OTP → new password) |

## Files Modified

### Backend

| File | Change |
|------|--------|
| `backend/src/routes/authRoute.js` | Added 3 routes: `/forgot-password`, `/verify-otp`, `/reset-password` |
| `backend/package.json` | Added `resend` dependency |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/services/authService.ts` | Added `forgotPassword()`, `verifyOTP()`, `resetPassword()` API methods |
| `frontend/src/lib/axios.ts` | Added password-reset URLs to the retry-skip list |
| `frontend/src/App.tsx` | Added `/forgot-password` route |
| `frontend/src/components/auth/signin-form.tsx` | Added "Forgot Password?" link + `password_reset` success toast |

---

## API Endpoints

### `POST /api/auth/forgot-password`
- **Body:** `{ email }`
- **Success (200):** `{ message: "OTP sent to your email." }`
- **Not found (404):** `{ message: "No account found with this email." }`
- **Cooldown (429):** `{ message: "Please wait X seconds...", cooldownSeconds }`

### `POST /api/auth/verify-otp`
- **Body:** `{ email, otp }`
- **Success (200):** `{ message: "OTP verified successfully.", resetToken }`
- **Invalid (400):** `{ message: "Invalid OTP. X attempts remaining.", attemptsLeft }`
- **Expired (400):** `{ message: "Too many failed attempts...", expired: true }`

### `POST /api/auth/reset-password`
- **Body:** `{ resetToken, newPassword }`
- **Success (200):** `{ message: "Password updated successfully." }`
- **Invalid token (400):** `{ message: "Invalid or expired reset token." }`

---

## Security Measures

| Feature | Implementation |
|---------|---------------|
| OTP storage | Hashed with bcrypt (not stored in plain text) |
| Single-use OTP | Deleted immediately after successful verification |
| Time-limited OTP | 10-minute expiry + MongoDB TTL auto-cleanup |
| Brute force protection | Max 5 wrong attempts, then OTP is invalidated |
| Resend cooldown | 60-second minimum between OTP sends (server-enforced) |
| Reset token | JWT with `purpose: "password-reset"` claim, 15-minute expiry |
| No info leakage | Existing sign-in still returns generic 401 for both wrong username and wrong password |

---

## OTP Email Template

The email features:
- Chatify-branded purple gradient header
- Large, clearly displayed 6-digit OTP code in a dashed border box
- 10-minute expiry notice
- Security note ("If you didn't request this...")
- Footer with copyright

---

## Frontend UX Details

### Step 1 — Enter Email
- Email validation (format check)
- Inline error display for invalid email or "email not found"
- Loading spinner on submit button

### Step 2 — Enter OTP
- 6 individual digit input boxes with auto-focus on next
- Paste support (paste full 6-digit code)
- Backspace navigates to previous box
- Auto-submit when all 6 digits are entered
- Live countdown timer (10:00 → 0:00)
- "Resend OTP" button with 60s cooldown (server-enforced)
- "Use a different email" back button
- Inline error with remaining attempts

### Step 3 — Set New Password
- Two password fields with show/hide toggle
- Client-side validation (min 6 chars, must match)
- On success: redirect to `/signin?message=password_reset`
- Success toast displayed on sign-in page
