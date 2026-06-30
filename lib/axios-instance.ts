import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch {
    return null;
  }
}

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = api
    .post("/auth/refresh")
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// Request interceptor for adding auth token and silent refresh
api.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("access_token");

    if (token) {
      const decoded = decodeJwt(token);
      const now = Math.floor(Date.now() / 1000);

      // If token expires in less than 5 minutes, refresh silently
      if (decoded?.exp && decoded.exp - now < 300) {
        try {
          await refreshToken();
        } catch (err) {
          console.warn("Silent refresh failed, will retry on 401");
        }
      }

      const currentToken = Cookies.get("access_token");
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 and other errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized) - try refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await refreshToken();

        // Retry original request with new token
        const newToken = Cookies.get("access_token");
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          Cookies.remove("access_token", { path: "/" });
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
