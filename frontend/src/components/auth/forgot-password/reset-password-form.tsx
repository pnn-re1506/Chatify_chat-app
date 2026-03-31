import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authService } from "@/services/authService";
import { AxiosError } from "axios";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

interface ResetPasswordFormProps {
  resetToken: string | null;
}

export function ResetPasswordForm({ resetToken }: ResetPasswordFormProps) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async () => {
    setResetError(null);

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }
    if (!resetToken) {
      setResetError("Invalid session. Please start over.");
      return;
    }

    try {
      setResetLoading(true);
      await authService.resetPassword(resetToken, newPassword);
      navigate("/signin?message=password_reset");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setResetError(axiosError.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleResetPassword();
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Label htmlFor="new-password" className="block text-sm">
            New password
          </Label>
          <PasswordInput
            id="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (resetError) setResetError(null);
            }}
            placeholder="At least 6 characters"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="confirm-password" className="block text-sm">
            Confirm password
          </Label>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (resetError) setResetError(null);
            }}
            placeholder="Re-enter your password"
          />
        </div>
        {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
        <Button type="submit" className="w-full" disabled={resetLoading}>
          {resetLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" />
              Updating…
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>
      </div>
    </form>
  );
}
