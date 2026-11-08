/**
 * Guards the login page's silent session restore against redirect loops.
 *
 * The login page trades the refresh cookie for a new access token and sends
 * the admin back to `next`. If the middleware then rejects that token (e.g.
 * ADMIN_JWT_SECRET missing or different from the backend's), it bounces
 * straight back here and the page would restore again, forever, showing only
 * "Checking your session…". We remember a successful restore for a short
 * window; landing here again for the same destination inside that window
 * means the restore did not stick, so the login form is shown instead.
 */

const STORAGE_KEY = "admin_session_restore";

/** A bounce back inside this window counts as a loop. */
export const RESTORE_LOOP_WINDOW_MS = 15_000;

type RestoreMarker = { next: string; at: number };

function readMarker(): RestoreMarker | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RestoreMarker>;
    if (typeof parsed?.next !== "string" || typeof parsed?.at !== "number")
      return null;
    return { next: parsed.next, at: parsed.at };
  } catch {
    return null;
  }
}

/** False when a restore for `next` just succeeded and we were sent back anyway. */
export function shouldAttemptRestore(
  next: string,
  now: number = Date.now(),
): boolean {
  const marker = readMarker();
  if (!marker) return true;
  return !(
    marker.next === next &&
    now - marker.at >= 0 &&
    now - marker.at < RESTORE_LOOP_WINDOW_MS
  );
}

export function markRestoreSucceeded(
  next: string,
  now: number = Date.now(),
): void {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ next, at: now }),
    );
  } catch {
    // Storage unavailable (private mode, blocked): no loop guard, still works.
  }
}

export function clearRestoreMarker(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
