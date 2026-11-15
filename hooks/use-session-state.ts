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

// False until the first page of this visit has mounted. While the server-rendered
// HTML is being hydrated the first render must use the defaults (the server knew
// nothing of sessionStorage); every page opened after that is rendered in the
// browser only and can start straight from the saved value.
let pageHydrated = false

function readValue<T>(key: string): { value: T } | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw === null ? null : { value: JSON.parse(raw) as T }
  } catch {
    return null
  }
}

/**
 * Drop-in for `useState` whose value survives leaving the page and coming back
 * in the same browser tab — for a page's search box, filters, sort and the row
 * or conversation that was open, so "back" lands exactly where the admin was.
 *
 * Coming back through the panel's own navigation, the saved value is there on
 * the very first render, before any effect that would pick a default row.
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (!pageHydrated) return initial
    const saved = readValue<T>(key)
    return saved ? saved.value : initial
  })
  const [restored, setRestored] = useState(pageHydrated)

  useEffect(() => {
    pageHydrated = true
    if (restored) return
    const saved = readValue<T>(key)
    if (saved) setValue(saved.value)
    setRestored(true)
    // Runs once: `restored` only ever goes false → true here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!restored) return
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  }, [key, value, restored])

  return [value, setValue] as const
}
