import Cookies from "js-cookie"
import type { AdminAccess } from "@/lib/admin-access"

/**
 * The last access answer the API gave this browser, kept so a fresh page load
 * can draw the sidebar and the page straight away instead of waiting on
 * GET /admin/me/access. The panel always re-asks the API in the background and
 * replaces this, and the API enforces every permission on its own, so a stale
 * copy can only show a link or button that is then refused.
 *
 * The copy is tied to the signed-in account (the token's `sub`), so signing in
 * as someone else never shows the previous person's menu.
 */

const STORAGE_KEY = "huza-admin-access-v1"

/** Same lifetime as the access cookie: older than this, the session is gone anyway. */
export const ACCESS_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type StoredAccess = { sub: string; at: number; access: AdminAccess }

function currentSub(): string | null {
  try {
    const token = Cookies.get("access_token")
    const payload = token?.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const sub = JSON.parse(atob(base64))?.sub
    return typeof sub === "string" && sub ? sub : null
  } catch {
    return null
  }
}

export function readCachedAccess(now: number = Date.now()): AdminAccess | undefined {
  try {
    const sub = currentSub()
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!sub || !raw) return undefined
    const stored = JSON.parse(raw) as Partial<StoredAccess>
    if (stored.sub !== sub || typeof stored.at !== "number") return undefined
    if (now - stored.at < 0 || now - stored.at > ACCESS_CACHE_MAX_AGE_MS) return undefined
    const access = stored.access
    if (!access || access.isStaff !== true || !Array.isArray(access.permissions)) return undefined
    return access
  } catch {
    return undefined
  }
}

export function writeCachedAccess(access: AdminAccess, now: number = Date.now()): void {
  try {
    const sub = currentSub()
    // Only a positive answer is worth remembering; "no access" must always be asked again.
    if (!sub || !access?.isStaff) return clearCachedAccess()
    const stored: StoredAccess = { sub, at: now, access }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // Storage unavailable (private mode, blocked): the panel just loads as before.
  }
}

export function clearCachedAccess(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
