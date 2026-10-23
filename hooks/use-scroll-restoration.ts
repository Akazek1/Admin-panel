"use client"

import { useEffect, useRef } from "react"

/**
 * Remember the window scroll position of a page for this browser tab and put
 * it back once the page's content is ready (pass `ready` when the list has
 * rendered — restoring before the rows exist would clamp to the top).
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const storageKey = `scroll:${key}`
  const restoredRef = useRef(false)

  useEffect(() => {
    if (!ready || restoredRef.current) return
    restoredRef.current = true
    let y = 0
    try {
      y = Number(window.sessionStorage.getItem(storageKey) ?? 0)
    } catch {
      return
    }
    if (y > 0) requestAnimationFrame(() => window.scrollTo({ top: y }))
  }, [ready, storageKey])

  useEffect(() => {
    let frame = 0
    const save = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        // Don't overwrite the saved spot before we've had a chance to restore it.
        if (!restoredRef.current) return
        try {
          window.sessionStorage.setItem(storageKey, String(Math.round(window.scrollY)))
        } catch {
          // ignore
        }
      })
    }
    window.addEventListener("scroll", save, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", save)
    }
  }, [storageKey])
}
