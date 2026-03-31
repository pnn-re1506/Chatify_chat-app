import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

const signInSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export function SigninForm({ className, ...props }: React.ComponentProps<"div">) {
  const { signIn, signInWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginError, setLoginError] = useState<string | null>(null);
  const toastShown = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: localStorage.getItem("lastUsername") || "",
    },
  });

  // Show error/success toast based on search params
  useEffect(() => {
    if (toastShown.current) return;

    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error || message) {
      toastShown.current = true;

      if (error) {
        const messages: Record<string, string> = {
          access_denied: "Google sign-in was cancelled.",
          csrf_failed: "Security validation failed. Please try again.",
          server_error: "Something went wrong. Please try again.",
        };
        toast.error(messages[error] || `Sign-in error: ${error}`);
      }
      
      if (message === "password_reset") {
        toast.success("Password updated. Please sign in.");
      }

      // Clean the URL params smoothly so it doesn't show again on reload
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);

  const onSubmit = async (data: SignInFormValues) => {
    const { username, password } = data;
    try {
      setLoginError(null);
      await signIn(username, password);
      navigate("/");
    } catch {
      setLoginError("Username or password is incorrect");
    }
  };

  // Clear login error when user starts typing
  const handleInputChange = () => {
    if (loginError) {
      setLoginError(null);
    }
  };

  const passwordRegister = register("password", { onChange: handleInputChange });
  const usernameRegister = register("username", {
    onChange: (e) => {
      handleInputChange();
      localStorage.setItem("lastUsername", e.target.value);
    },
  });

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="overflow-hidden p-0 border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a
                  href="/"
                  className="mx-auto block w-fit text-center"
                >
                  <img
                    src="/logo.svg"
                    alt="logo"
                  />
                </a>

                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Sign in to your Chatify account
                </p>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="username"
                  className="block text-sm"
                >
                  Username
                </Label>
                <Input
                  type="text"
                  id="username"
                  placeholder="user1"
                  {...usernameRegister}
                />
                {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <Label
                  htmlFor="password"
                  className="block text-sm"
                >
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  className={loginError ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30" : ""}
                  {...passwordRegister}
                />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
                {loginError && (
                  <p className="text-red-500 text-sm">
                    {loginError}
                  </p>
                )}
                <a
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors w-fit"
                >
                  Forgot Password?
                </a>
              </div>

              {/* nút đăng nhập */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                Sign in
              </Button>

              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or continue with</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={signInWithGoogle}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Sign in with Google
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="underline underline-offset-4"
                >
                  Sign up
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.png"
              alt="Image"
              className="absolute top-1/2 -translate-y-1/2 object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className=" text-xs text-balance px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offetset-4">
        By continuing, you agree to our <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </div>
    </div>
  );
}