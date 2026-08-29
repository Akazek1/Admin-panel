"use client"

import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

/**
 * Copies plain text with a layered fallback chain: async clipboard, then
 * legacy execCommand copy. Admin screens deal in real contact info (phone,
 * email) that staff need to paste elsewhere — this is the one place that
 * behavior lives so every copy button acts the same.
 */
export function useCopyToClipboard() {
  const { toast } = useToast()

  return useCallback(
    async (value: string, label?: string) => {
      const description = label ? `${label} copied to clipboard.` : "Copied to clipboard."
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value)
          toast({ title: "Copied", description })
          return
        }
      } catch {
        /* fall through to legacy copy */
      }
      try {
        const ta = document.createElement("textarea")
        ta.value = value
        ta.setAttribute("readonly", "")
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        if (ok) {
          toast({ title: "Copied", description })
          return
        }
      } catch {
        /* fall through */
      }
      toast({ title: "Couldn't copy automatically", description: value })
    },
    [toast]
  )
}
