/**
 * Unsent chat text, kept per conversation for this browser tab
 * (sessionStorage), so leaving a chat — to look at a profile, another thread
 * or another page — and coming back finds the message still there.
 */

const PREFIX = "admin-draft:"

const keyFor = (scope: string, id: string) => `${PREFIX}${scope}:${id}`

export function readDraft(scope: string, id: string | null | undefined): string {
  if (!id) return ""
  try {
    return window.sessionStorage.getItem(keyFor(scope, id)) ?? ""
  } catch {
    return ""
  }
}

/** Saves the text, or forgets the draft when it is empty. */
export function writeDraft(scope: string, id: string | null | undefined, text: string): void {
  if (!id) return
  try {
    if (text) window.sessionStorage.setItem(keyFor(scope, id), text)
    else window.sessionStorage.removeItem(keyFor(scope, id))
  } catch {
    // Storage unavailable: the chat still works, it just won't remember.
  }
}

/** Forget every draft — on sign-out, so the next person at this tab sees none. */
export function clearAllDrafts(): void {
  try {
    const storage = window.sessionStorage
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i)
      if (key?.startsWith(PREFIX)) storage.removeItem(key)
    }
  } catch {
    // ignore
  }
}
