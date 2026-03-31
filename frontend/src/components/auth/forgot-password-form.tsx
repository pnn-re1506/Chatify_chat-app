import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RequestOtpForm } from "./forgot-password/request-otp-form";
import { VerifyOtpForm } from "./forgot-password/verify-otp-form";
import { ResetPasswordForm } from "./forgot-password/reset-password-form";

type Step = "email" | "otp" | "reset";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isGoogleOnly, setIsGoogleOnly] = useState(false);

  const getTitle = () => {
    if (isGoogleOnly) return "Google Account Detected";
    if (step === "email") return "Forgot Password";
    if (step === "otp") return "Enter Verification Code";
    return "Set New Password";
  };

  const getSubtitle = () => {
    if (isGoogleOnly) return "This account is linked to Google sign-in";
    if (step === "email") return "Enter your email and we'll send you a verification code";
    if (step === "otp") return `We sent a 6-digit code to ${email}`;
    return "Choose a strong password for your account";
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>
                <h1 className="text-2xl font-bold">{getTitle()}</h1>
                <p className="text-muted-foreground text-balance">{getSubtitle()}</p>
              </div>

              {/* Steps */}
              {step === "email" && (
                <RequestOtpForm
                  email={email}
                  setEmail={(v) => {
                    setEmail(v);
                    if (isGoogleOnly) setIsGoogleOnly(false);
                  }}
                  onSuccess={() => setStep("otp")}
                  onGoogleOnly={() => setIsGoogleOnly(true)}
                />
              )}
              {step === "otp" && (
                <VerifyOtpForm
                  email={email}
                  onSuccess={(token) => {
                    setResetToken(token);
                    setStep("reset");
                  }}
                  onBack={() => {
                    setStep("email");
                    setEmail("");
                    setIsGoogleOnly(false);
                  }}
                />
              )}
              {step === "reset" && <ResetPasswordForm resetToken={resetToken} />}
            </div>
          </div>

          {/* Right side image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offetset-4">
        By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
