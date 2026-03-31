import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface VerifyOtpFormProps {
  email: string;
  onSuccess: (resetToken: string) => void;
  onBack: () => void;
}

export function VerifyOtpForm({ email, onSuccess, onBack }: VerifyOtpFormProps) {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer (10 minutes)
  const [otpExpiresAt, setOtpExpiresAt] = useState<number>(Date.now() + 10 * 60 * 1000);
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60 * 1000);

  // Resend cooldown (60 seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(60);

  // ─── OTP Countdown ───────────────────────────────────
  useEffect(() => {
    if (otpExpiresAt === 0) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, otpExpiresAt - Date.now());
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpExpiresAt]);

  // ─── Resend Cooldown ─────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  // ─── OTP Input Handlers ──────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (otpError) setOtpError(null);

    // Only accept digits
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...otpValues];
    newValues[index] = value;
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current and go to previous
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const newValues = pasted.split("");
      setOtpValues(newValues);
      inputRefs.current[5]?.focus();
    }
  };

  // ─── Verification ──────────────────────────────
  const handleVerifyOTP = useCallback(async () => {
    if (attempts >= 5) return;

    const otp = otpValues.join("");

    if (otp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    if (timeLeft === 0) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }

    try {
      setOtpLoading(true);
      const data = await authService.verifyOTP(email, otp);
      onSuccess(data.resetToken);
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const axiosError = error as AxiosError<{ message: string; expired?: boolean }>;
      const msg = axiosError.response?.data?.message || "Invalid OTP";
      
      if (newAttempts >= 5) {
        setOtpError("Too many failed attempts. Please request a new code.");
        setTimeLeft(0);
      } else {
        setOtpError(msg);
        setOtpValues(Array(6).fill(""));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }

      if (axiosError.response?.data?.expired) {
        // OTP was invalidated due to too many attempts
        setTimeLeft(0);
      }
    } finally {
      setOtpLoading(false);
    }
  }, [otpValues, timeLeft, email, onSuccess, attempts]);

  // ─── Resend ──────────────────────────────────────
  const handleResendOTP = async () => {
    try {
      setOtpError(null);
      setEmailLoading(true);
      await authService.forgotPassword(email);
      setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
      setTimeLeft(10 * 60 * 1000);
      setResendCooldown(60);
      setOtpValues(Array(6).fill(""));
      setAttempts(0);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string; cooldownSeconds?: number }>;
      if (axiosError.response?.data?.cooldownSeconds) {
        setResendCooldown(axiosError.response.data.cooldownSeconds);
      }
      setOtpError(axiosError.response?.data?.message || "Failed to resend OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* OTP Input Boxes */}
      <div className="flex justify-center gap-2">
        {otpValues.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={index === 0 ? handleOtpPaste : undefined}
            className={cn(
              "w-11 h-12 text-center text-lg font-semibold rounded-lg border bg-transparent outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-xl",
              otpError
                ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
                : "border-input"
            )}
            disabled={timeLeft === 0}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center">
        {timeLeft > 0 ? (
          <p className="text-sm text-muted-foreground">
            Code expires in{" "}
            <span className="font-medium text-foreground">{formatTime(timeLeft)}</span>
          </p>
        ) : (
          <p className="text-sm text-red-500 font-medium">OTP expired</p>
        )}
      </div>

      {/* Error */}
      {otpError && <p className="text-red-500 text-sm text-center">{otpError}</p>}

      {/* Verify Button */}
      <Button
        type="button"
        className="w-full"
        disabled={otpLoading || otpValues.some((v) => v === "") || timeLeft === 0 || attempts >= 5}
        onClick={handleVerifyOTP}
      >
        {otpLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4" />
            Verifying…
          </span>
        ) : (
          "Verify OTP"
        )}
      </Button>

      {/* Resend */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Resend available in{" "}
            <span className="font-medium text-foreground">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            className="text-sm underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={handleResendOTP}
            disabled={emailLoading}
          >
            Resend OTP
          </button>
        )}
      </div>

      {/* Back */}
      <div className="text-center text-sm">
        <button
          type="button"
          className="underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={onBack}
        >
          ← Use a different email
        </button>
      </div>
    </div>
  );
}
