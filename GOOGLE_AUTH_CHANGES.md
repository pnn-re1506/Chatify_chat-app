# Google OAuth Integration — Changes Documentation

## Overview

Google OAuth 2.0 has been integrated as a **parallel authentication option** alongside the existing username/password system. The implementation uses the **Authorization Code Flow** with server-side token exchange, which is the most secure approach for a separate frontend/backend architecture.

### How It Works

```
User clicks "Sign in with Google"
  → Frontend redirects to backend: GET /api/auth/google
  → Backend generates CSRF state, stores in HttpOnly cookie
  → Backend redirects to Google's consent screen
  → User authenticates with Google
  → Google redirects to: GET /api/auth/google/callback?code=...&state=...
  → Backend validates state (CSRF), exchanges code for tokens
  → Backend verifies ID token, extracts user profile
  → Backend finds-or-creates user, issues JWT + refresh token
  → Backend redirects to frontend: /auth/google/callback?accessToken=...
  → Frontend stores token, fetches user data, navigates to app
```

---

## Files Modified

### Backend

| File | Change |
|------|--------|
| `backend/src/models/User.js` | `hashedPassword` changed from `required: true` → `required: false`. Added `googleId` (String, unique, sparse) and `authProvider` (enum: `"local"` \| `"google"`, default `"local"`) fields. |
| `backend/src/routes/authRoute.js` | Added `GET /google` and `GET /google/callback` routes, importing from the new `googleAuthController.js`. |
| `backend/package.json` | Added `google-auth-library` dependency. |

### Frontend

| File | Change |
|------|--------|
| `frontend/src/components/auth/signin-form.tsx` | Added "Sign in with Google" button with Google icon, an "or continue with" divider, and error toast handling for failed Google auth redirects. |
| `frontend/src/components/auth/signup-form.tsx` | Added matching "Sign up with Google" button with divider. |
| `frontend/src/App.tsx` | Added `/auth/google/callback` route pointing to `GoogleCallbackPage`. |
| `frontend/src/stores/useAuthStore.ts` | Added `signInWithGoogle()` (redirects to backend) and `handleGoogleCallback(accessToken)` (processes the returned token). |
| `frontend/src/services/authService.ts` | Added `getGoogleAuthUrl()` helper that returns the backend Google auth URL. |
| `frontend/src/types/store.ts` | Added `signInWithGoogle` and `handleGoogleCallback` to the `AuthState` interface. |
| `frontend/src/lib/axios.ts` | Added `/auth/google` to the interceptor skip list. |

## Files Created

| File | Purpose |
|------|---------|
| `backend/src/controllers/googleAuthController.js` | Handles the entire Google OAuth flow: `googleLogin` (generates state + redirects to Google) and `googleCallback` (validates state, exchanges code, verifies ID token, find-or-creates user, issues session). |
| `frontend/src/pages/GoogleCallbackPage.tsx` | Reads the access token from URL params after Google redirects back, processes it through the auth store, shows a loading spinner, and redirects to `/` on success or `/signin` on error. |

---

## Environment Variables Required

Add these to your **backend `.env`** file:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

> **No new frontend environment variables are needed** — the frontend uses the existing `VITE_API_URL` to construct the Google auth URL.

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **+ CREATE CREDENTIALS → OAuth client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins**: `http://localhost:5173`
7. **Authorized redirect URIs**: `http://localhost:5001/api/auth/google/callback`
8. Copy **Client ID** and **Client Secret** into your `.env`
9. Configure the **OAuth consent screen**:
   - App name: `Chatify`
   - Scopes: `email`, `profile`, `openid`

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| **CSRF Protection** | Cryptographically random `state` parameter stored in HttpOnly cookie, validated on callback |
| **Server-side Token Exchange** | Authorization code → tokens exchange happens on backend; `client_secret` never exposed to browser |
| **ID Token Verification** | Google's `id_token` is verified using `google-auth-library` (checks signature, audience, expiry) |
| **No Google Tokens Stored** | Only the Google `sub` claim (as `googleId`) is persisted; Google access/refresh tokens are discarded |
| **Same Session Security** | JWT access token (30min) + HttpOnly `refreshToken` cookie (14 days), identical to existing auth |

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Google email matches existing local account | Google ID is **auto-linked** to the existing account; user signs in normally |
| Returning Google user | Looked up by `googleId`, signs in directly |
| User cancels Google consent | Google redirects with `error=access_denied`; backend redirects to `/signin?error=access_denied`; frontend shows toast |
| Expired/invalid Google tokens | Backend verifies ID token; rejects if invalid |
| CSRF: forged callback | State parameter mismatch → redirects to `/signin?error=csrf_failed` |
| Username collision | Auto-generated from email prefix with random suffix (e.g., `john_8f3a`) |

---

## Existing Auth — Unchanged

The following existing auth functionality is **completely untouched**:

- `POST /api/auth/signup` — local registration
- `POST /api/auth/signin` — local login
- `POST /api/auth/signout` — logout
- `POST /api/auth/refresh` — token refresh
- `protectedRoute` middleware — JWT verification
- `socketAuthMiddleware` — Socket.IO auth
- All existing frontend auth flows

---

## Bugfix Log

### Fix: `Error 400: invalid_request — Missing required parameter: redirect_uri`

**Date**: 2026-03-30

**Root Cause**: The `OAuth2Client` was instantiated at **module top-level** in `googleAuthController.js`:

```js
// ❌ This runs at import time, BEFORE dotenv.config()
const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,      // undefined
    process.env.GOOGLE_CLIENT_SECRET,   // undefined
    process.env.GOOGLE_CALLBACK_URL     // undefined ← this is redirect_uri
);
```

In ESM (which this project uses), all `import` statements are evaluated **before** any module-level code executes. Since `dotenv.config()` is called in `server.js` after imports, `process.env.GOOGLE_CALLBACK_URL` was `undefined` when the `OAuth2Client` was constructed. Google requires `redirect_uri` in the authorization request — since it was `undefined`, Google returned `400: Missing required parameter: redirect_uri`.

**What Changed**: In `backend/src/controllers/googleAuthController.js`, replaced the top-level `OAuth2Client` instantiation with a **lazy singleton** pattern:

```js
// ✅ Created on first HTTP request, when env vars are guaranteed loaded
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
```

All references to `oAuth2Client` were updated to `getOAuth2Client()`.

**Google Cloud Console**: Ensure these **exact** redirect URIs are registered under your OAuth 2.0 Client ID → **Authorized redirect URIs**:

| Environment | Redirect URI |
|-------------|-------------|
| Local dev | `http://localhost:5001/api/auth/google/callback` |
| Production | `https://your-domain.com/api/auth/google/callback` |

The URI must match **exactly** — including protocol (`http` vs `https`), port, and path. No trailing slash.

