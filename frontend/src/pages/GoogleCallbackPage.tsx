import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";

const GoogleCallbackPage = () => {
  const { handleGoogleCallback } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    // Prevent double-processing in React strict mode
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get("accessToken");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      navigate("/signin?error=" + error, { replace: true });
      return;
    }

    if (!accessToken) {
      navigate("/signin?error=no_token", { replace: true });
      return;
    }

    handleGoogleCallback(accessToken).then(() => {
      navigate("/", { replace: true });
    }).catch(() => {
      navigate("/signin?error=callback_failed", { replace: true });
    });
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-purple">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">
          Signing in with Google...
        </p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
