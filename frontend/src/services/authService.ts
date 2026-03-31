import api from "../lib/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const authService = {
    signUp :async (username: string, password: string, email: string, firstName: string, lastName: string) => {
        try {
            const response = await api.post("/auth/signup", {
                username,
                password,
                email,
                firstName,
                lastName
            }, {withCredentials: true})
            return response.data;
        } catch (error) {
            
        }
    }   ,

    signIn :async (username: string, password: string) => {
        
            const res = await api.post("/auth/signin", {
                username,
                password
            }, {withCredentials: true})
            return res.data;
    },
    signOut :async () => {
        return api.post("/auth/signout", {}, {withCredentials: true});
    },
    fetchMe: async () => {
        const res = await api.get("/users/me", {withCredentials: true});
        return res.data.user;
    },
    refresh: async () => {
        const res = await api.post("/auth/refresh", {}, {withCredentials: true});
        return res.data.accessToken;
    },

    /** Returns the full URL to redirect to for Google OAuth */
    getGoogleAuthUrl: () => {
        return `${API_BASE_URL}/auth/google`;
    },

    /** Forgot Password — send OTP to email */
    forgotPassword: async (email: string) => {
        const res = await api.post("/auth/forgot-password", { email });
        return res.data;
    },

    /** Verify OTP and get reset token */
    verifyOTP: async (email: string, otp: string) => {
        const res = await api.post("/auth/verify-otp", { email, otp });
        return res.data;
    },

    /** Reset password using reset token */
    resetPassword: async (resetToken: string, newPassword: string) => {
        const res = await api.post("/auth/reset-password", { resetToken, newPassword });
        return res.data;
    },
}