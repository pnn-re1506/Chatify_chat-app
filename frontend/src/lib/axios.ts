import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})
//add access token to request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(async (res) => res, async (error) => {
    const originalRequest = error.config;

    //apis don't need to check
    if(originalRequest.url.includes("/auth/signin") || originalRequest.url.includes("/auth/signup") || originalRequest.url.includes("/auth/refresh")){
        return Promise.reject(error);
    }
    originalRequest._retryCount = originalRequest._retryCount || 0;
    if(error.response?.status === 403 && originalRequest._retryCount < 4){
        originalRequest._retryCount++;
        console.log("refreshing token", originalRequest._retryCount);
        try {
            const res = await api.post("/auth/refresh", {withCredentials: true});
            const newAccessToken = res.data.accessToken;
            useAuthStore.getState().setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
            
        } catch (refreshError) {
            useAuthStore.getState().clearState();
            return Promise.reject(refreshError);
        }
    }
    return Promise.reject(error);

})
export default api;