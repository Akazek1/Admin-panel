"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const read = <T,>(key: string): Partial<T> | null => {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Partial<T>) : null
  } catch {
    return null
  }
}

/**
 * State that survives leaving the page and coming back in the same browser
 * tab (sessionStorage) — e.g. a list's search, filters, sort and page, so
 * opening a row and pressing back returns you to exactly where you were.
 *
 * Starts from `defaults` on the first render (so server and client render the
 * same thing) and restores the saved value right after mount. `restored`
 * flips to true once that has happened.
 */
export function useSessionState<T extends object>(key: string, defaults: T) {
  const [state, setState] = useState<T>(defaults)
  const [restored, setRestored] = useState(false)
  const defaultsRef = useRef(defaults)

  useEffect(() => {
    const saved = read<T>(key)
    if (saved) setState({ ...defaultsRef.current, ...saved })
    setRestored(true)
  }, [key])

  useEffect(() => {
    if (!restored) return
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Private mode / storage full: the page still works, it just won't remember.
    }
  }, [key, state, restored])

  const patch = useCallback((update: Partial<T> | ((current: T) => Partial<T>)) => {
    setState((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) }))
  }, [])

  return { state, patch, restored }
}

/** Write a value into another page's saved state, e.g. to open a list pre-searched. */
export function seedSessionState<T extends object>(key: string, value: Partial<T>) {
  try {
    const current = read<T>(key) ?? {}
    window.sessionStorage.setItem(key, JSON.stringify({ ...current, ...value }))
  } catch {
    // ignore
  }
}
