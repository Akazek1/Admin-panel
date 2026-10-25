import axios from "axios";
import Cookies from "js-cookie";

/** Fired on any 403 so the panel re-fetches the caller's access. */
export const ADMIN_ACCESS_STALE_EVENT = "admin-access-stale";

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

  // The admin panel has its own refresh route + cookie, separate from the
  // user app's, and must store the token it gets back.
  refreshPromise = api
    .post("/auth/admin/refresh")
    .then((res) => {
      const token = res.data?.data?.token || res.data?.token;
      if (token) {
        Cookies.set("access_token", token, {
          expires: 7,
          secure: true,
          sameSite: "Lax",
        });
      }
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Trades the admin refresh cookie for a fresh access token. Used by the login
 * page so an admin whose short-lived token expired goes straight back in.
 */
export async function tryRestoreSession(): Promise<boolean> {
  try {
    await refreshToken();
    return !!Cookies.get("access_token");
  } catch {
    return false;
  }
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

    // A 401 from the auth routes themselves (wrong password, expired refresh
    // cookie, sign-out) is the answer, not a stale access token — refreshing
    // there would turn a failed login into a silent sign-in.
    const isAuthRoute = String(originalRequest?.url ?? "").includes("/auth/");

    // Handle 401 errors (unauthorized) - try refresh once
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
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

    // A permission refusal means this browser's idea of the role may be stale
    // (the owner just changed it) — ask the panel to re-check access now.
    if (
      error.response?.status === 403 &&
      typeof window !== "undefined" &&
      !String(originalRequest?.url ?? "").includes("/admin/me/access")
    ) {
      window.dispatchEvent(new Event(ADMIN_ACCESS_STALE_EVENT));
    }

    // Owner-issued temporary password: every route but the change screen refuses.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === "PASSWORD_CHANGE_REQUIRED" &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/admin/change-password"
    ) {
      window.location.href = "/admin/change-password";
    }

    return Promise.reject(error);
  }
);

export default api;
