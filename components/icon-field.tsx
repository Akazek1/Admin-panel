"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const isUrl = (v: string) => /^https?:\/\//i.test(v.trim())

// An icons8 *page* link, e.g. https://icons8.com/icon/abc123/lipstick — the last
// path segment is the icon's name.
const ICONS8_PAGE = /^https?:\/\/(?:www\.)?icons8\.com\/icon\/[^/]+\/([^/?#]+)/i

/**
 * Let people paste the icons8 page link they naturally copy from the browser and
 * turn it into a direct image URL in the app's green style. Anything else (a real
 * image URL, emoji, or lucide name) passes through unchanged.
 */
function normalizeIconValue(raw: string): string {
  const match = raw.trim().match(ICONS8_PAGE)
  return match ? `https://img.icons8.com/ios/48/145B10/${match[1]}.png` : raw
}

/** Renders an icon value (image URL, emoji, or lucide name) for list/table use. */
export function IconGlyph({ value, className = "h-6 w-6" }: { value?: string | null; className?: string }) {
  if (value && isUrl(value)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={value} alt="" className={`${className} object-contain`} />
  }
  return <span>{value || "•"}</span>
}

interface IconFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

/**
 * Icon input that accepts a pasted image URL, an emoji, or a lucide icon name.
 * When a URL is entered it shows a live preview; if the image fails to load the
 * user is told a default icon will be used instead.
 */
export function IconField({ value, onChange, label = "Icon" }: IconFieldProps) {
  const [broken, setBroken] = useState(false)
  const url = isUrl(value)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 text-xl">
          {url && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Icon preview"
              className="h-8 w-8 object-contain"
              onError={() => setBroken(true)}
              onLoad={() => setBroken(false)}
            />
          ) : (
            <span>{value && !url ? value : "•"}</span>
          )}
        </span>
        <Input
          value={value}
          onChange={(e) => {
            setBroken(false)
            onChange(normalizeIconValue(e.target.value))
          }}
          placeholder="Paste an icons8 link, image URL, or emoji"
        />
      </div>
      {url && broken && (
        <p className="text-xs text-destructive">
          Couldn&apos;t load that image — a default icon will be used.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Browse{" "}
        <a
          href="https://icons8.com/icons"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          icons8.com/icons
        </a>
        , click an icon, then copy its page link from your browser and paste it
        here — it&apos;s converted to an image automatically.
      </p>
    </div>
  )
}
