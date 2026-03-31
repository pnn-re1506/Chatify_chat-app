import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      loading: false,

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },
      setUser: (user) => {
        set({ user });
      },
      clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        useChatStore.getState().reset();
        const lastUsername = localStorage.getItem("lastUsername");
        localStorage.clear();
        if (lastUsername) localStorage.setItem("lastUsername", lastUsername);
        sessionStorage.clear();
      },
      signUp: async (username, password, email, firstName, lastName) => {
        try {
          set({ loading: true });

          //  gọi api
          await authService.signUp(username, password, email, firstName, lastName);

          toast.success(
            "Sign up successfully! You will be redirected to the login page."
          );
        } catch (error) {
          console.error(error);
          toast.error("Sign up failed!");
        } finally {
          set({ loading: false });
        }
      },
      signIn: async (username, password) => {
        try {
          get().clearState();
          set({ loading: true });

          const { accessToken } = await authService.signIn(username, password);
          get().setAccessToken(accessToken);

          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Welcome back to Chatify 🎉");
        } catch (error) {
          console.error(error);
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      signInWithGoogle: () => {
        // Redirect to backend Google OAuth endpoint
        window.location.href = authService.getGoogleAuthUrl();
      },
      handleGoogleCallback: async (accessToken) => {
        try {
          get().clearState();
          set({ loading: true });

          get().setAccessToken(accessToken);

          await get().fetchMe();
          useChatStore.getState().fetchConversations();

          toast.success("Welcome back to Chatify 🎉");
        } catch (error) {
          console.error(error);
          toast.error("Google sign in failed!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          get().clearState();
          await authService.signOut();
          toast.success("Logout successfully!");
        } catch (error) {
          console.error(error);
          toast.error("Logout failed!");
        }
      },
      fetchMe: async () => {
        try {
          set({ loading: true });
          const user = await authService.fetchMe();

          set({ user });
        } catch (error) {
          console.error(error);
          set({ user: null, accessToken: null });
          toast.error("Error when fetching user data. Please try again!");
        } finally {
          set({ loading: false });
        }
      },
      refresh: async () => {
        try {
          set({ loading: true });
          const { user, fetchMe, setAccessToken } = get();
          const accessToken = await authService.refresh();

          setAccessToken(accessToken);

          if (!user) {
            await fetchMe();
          }
        } catch (error) {
          console.error(error);
          toast.error("Session expired. Please login again!");
          get().clearState();
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // chỉ persist user
    }
  )
);