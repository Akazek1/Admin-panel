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

/**
 * The refresh call blocks the login page ("Checking your session…") and every
 * request that waits on it, so it must not hang when the API is slow or down.
 */
export const REFRESH_TIMEOUT_MS = 10_000;

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

/** Renew this long before expiry, so a token is never stale mid-click. */
const REFRESH_EARLY_SECONDS = 300;

/** One refresh at a time across every open tab of the panel. */
const REFRESH_LOCK = "huza-admin-token-refresh";

function secondsLeft(token: string | undefined): number {
  const exp = token ? decodeJwt(token)?.exp : undefined;
  return exp ? exp - Math.floor(Date.now() / 1000) : -Infinity;
}

/**
 * Refresh tokens are single-use: two tabs trading the same cookie at once
 * looks like theft to the API and ends the session. So tabs queue on a Web
 * Lock, and a tab that waited first checks whether the tab ahead of it already
 * stored a new token — if so there is nothing left to do.
 */
function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return run();
  return locks.request(REFRESH_LOCK, run) as Promise<T>;
}

/**
 * `staleToken` is the access token the caller wants replaced. If the cookie
 * holds a different, still-fresh one by the time we get the lock, another tab
 * did the work.
 */
async function refreshToken(staleToken?: string) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = withRefreshLock(async () => {
    const current = Cookies.get("access_token");
    if (current && current !== staleToken && secondsLeft(current) > REFRESH_EARLY_SECONDS) {
      return;
    }

    // The admin panel has its own refresh route + cookie, separate from the
    // user app's, and must store the token it gets back.
    const res = await api.post("/auth/admin/refresh", undefined, { timeout: REFRESH_TIMEOUT_MS });
    const token = res.data?.data?.token || res.data?.token;
    if (token) {
      Cookies.set("access_token", token, {
        expires: 7,
        secure: true,
        sameSite: "Lax",
      });
    }
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Keeps the access token fresh while a panel page is open, so navigation and
 * API calls never meet an expired one. Checks every minute and whenever the
 * tab is looked at again (timers barely run in background tabs). Returns a
 * cleanup function.
 */
export function startSessionKeepAlive(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const check = () => {
    if (document.visibilityState === "hidden") return;
    const token = Cookies.get("access_token");
    if (!token || secondsLeft(token) > REFRESH_EARLY_SECONDS) return;
    // Failures are left to the next check or the next API call's 401 handling.
    refreshToken(token).catch(() => undefined);
  };

  check();
  const timer = window.setInterval(check, 60_000);
  document.addEventListener("visibilitychange", check);
  window.addEventListener("focus", check);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", check);
    window.removeEventListener("focus", check);
  };
}

/**
 * Trades the admin refresh cookie for a fresh access token. Used by the login
 * page so an admin whose short-lived token expired goes straight back in.
 */
export async function tryRestoreSession(): Promise<boolean> {
  // Whatever access token is left here is the stale one that sent the admin
  // to the login page. Drop it so success means the refresh issued a new one.
  Cookies.remove("access_token", { path: "/" });
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

    // Auth routes (refresh, login, logout) never wait on a refresh: the
    // refresh request itself passes through here, and awaiting refreshToken()
    // for it would wait on its own promise forever without ever sending it.
    const isAuthRoute = String(config.url ?? "").includes("/auth/");

    if (token) {
      // If token expires in less than 5 minutes, refresh silently
      if (!isAuthRoute && secondsLeft(token) < REFRESH_EARLY_SECONDS) {
        try {
          await refreshToken(token);
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

      const usedToken = String(originalRequest.headers?.Authorization ?? "").replace(/^Bearer /, "");

      try {
        await refreshToken(usedToken || undefined);

        // Retry original request with new token
        const newToken = Cookies.get("access_token");
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Only a refused refresh means the session is over. A timeout, a
        // network blip or a 429/5xx says nothing about the session, so the
        // admin stays signed in and the next request simply tries again.
        if (refreshError?.response?.status === 401 && typeof window !== "undefined") {
          Cookies.remove("access_token", { path: "/" });
          const next = window.location.pathname + window.location.search;
          window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
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
