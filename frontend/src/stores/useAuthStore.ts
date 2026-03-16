import { create } from "zustand";
import {toast} from "sonner";
import type { AuthState } from "../../types/store";
import { authService } from "../services/authService";

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => {
        set({accessToken: null, user: null, loading: false});
    },
    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({loading: true});

            //call api
            await authService.signUp(username, password, email, firstName, lastName);

            toast.loading("Sign up successfully! You will be redirected to the login page");
        } catch (error) {
            console.error(error);
            toast.error("Sign up failed!");
        } finally {
            set({loading: false});
        }
    },

    signIn: async (username, password) => {
        try {
            set({loading: true});

            const {accessToken} = await authService.signIn(username, password);

            get().setAccessToken(accessToken);
            await get().fetchMe();
            toast.success("Sign in successfully! You will be redirected to the home page");
        } catch (error) {
            console.error(error);
            toast.error("Sign in failed!");
        } finally {
            set({loading: false});
        }
    },


    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success("Sign out successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Sign out failed!");
        } finally {
            set({loading: false});
        }
    },

    fetchMe: async () => {
        try {
            set({loading: true});
            const user = await authService.fetchMe();
            set({user});
        } catch (error) {
            console.error(error);
            set({user: null, accessToken: null})
            toast.error("Failed to fetch user!");
        } finally {
            set({loading: false});
        }
    },
    refresh: async () => {
        try {
            set({loading: true});
            const {user, fetchMe, setAccessToken} = get();
            const accessToken = await authService.refresh();
            setAccessToken(accessToken);         
            if(!user) {
                await fetchMe();
            }
        } catch (error) {
            console.error(error);
            get().clearState();
            toast.error("Session expired! Please sign in again!");
        } finally {
            set({loading: false});
        }
    },
    setAccessToken: (accessToken: string) => {
        set({accessToken});
    }



}))