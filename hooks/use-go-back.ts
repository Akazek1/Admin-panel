"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"

/** True when this tab has an earlier page to return to. */
function canGoBack(): boolean {
  if (typeof window === "undefined") return false
  // The Navigation API answers this exactly; older browsers only expose a count.
  const navigation = (window as unknown as { navigation?: { canGoBack?: boolean } }).navigation
  if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack
  return window.history.length > 1
}

/**
 * A back button that returns to the page the admin actually came from (a chat,
 * a search result, a list), not to a fixed list. `fallback` is used only when
 * there is nowhere to go back to — the page was opened in a new tab or from a
 * pasted link.
 */
export function useGoBack(fallback: string) {
  const router = useRouter()
  return useCallback(() => {
    if (canGoBack()) router.back()
    else router.push(fallback)
  }, [router, fallback])
}
