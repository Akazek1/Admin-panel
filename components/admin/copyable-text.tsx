"use client"

import { Copy } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { cn } from "@/lib/utils"

interface CopyableTextProps {
  value: string
  display?: string
  label?: string
  className?: string
}

/**
 * A phone number or email rendered as plain text with a tap-to-copy icon.
 * `stopPropagation` matters here specifically: every admin table row is
 * itself a click target that navigates to the detail page, so without it
 * copying a phone number in the list would also open the row.
 */
export function CopyableText({ value, display, label, className }: CopyableTextProps) {
  const copy = useCopyToClipboard()

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span className="truncate">{display ?? value}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          copy(value, label)
        }}
        className="shrink-0 rounded-md p-0.5 text-current opacity-50 hover:opacity-100 hover:bg-white/10"
        aria-label={label ? `Copy ${label.toLowerCase()}` : "Copy"}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}
