import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";

interface RequestOtpFormProps {
  onSuccess: (email: string) => void;
  onGoogleOnly: () => void;
  email: string;
  setEmail: (email: string) => void;
}

export function RequestOtpForm({ onSuccess, onGoogleOnly, email, setEmail }: RequestOtpFormProps) {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);

  const handleSendOTP = async () => {
    setEmailError(null);
    setSuccessMessage(null);
    setIsGoogleOnly(false);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setEmailLoading(true);
      const data = await authService.forgotPassword(email);

      // Case 2: Google-only account
      if (data.googleOnly) {
        setIsGoogleOnly(true);
        setSuccessMessage(data.message);
        onGoogleOnly();
        return;
      }

      // Cases 1 & 3: Generic success message (email not found OR OTP sent)
      setSuccessMessage(data.message);

      // Move to OTP step after a brief moment so user sees the message
      setTimeout(() => onSuccess(email), 4500);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setEmailError(axiosError.response?.data?.message || "Failed to send OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSendOTP();
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="email" className="block text-sm">
            Email address
          </Label>
          <Input
            type="email"
            id="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
              if (successMessage) {
                setSuccessMessage(null);
                setIsGoogleOnly(false);
              }
            }}
            className={
              emailError
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                : ""
            }
          />
          {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
          {successMessage && !isGoogleOnly && (
            <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
          )}
        </div>

        {/* Google-only account message */}
        {isGoogleOnly ? (
          <>
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              {successMessage}
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.location.href = "/signin"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Sign in with Google instead
            </Button>
          </>
        ) : (
          <Button type="submit" className="w-full" disabled={emailLoading || !!successMessage}>
            {emailLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" />
                Sending…
              </span>
            ) : (
              "Send Reset Code"
            )}
          </Button>
        )}

        <div className="text-center text-sm">
          <a
            href="/signin"
            className="underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to sign in
          </a>
        </div>
      </div>
    </form>
  );
}
