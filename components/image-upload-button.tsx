"use client"

import * as React from "react"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

/**
 * A button that opens the OS file picker for a single image and hands the
 * chosen file to `onFile`. Keeps its own pending state and surfaces errors as
 * a toast, so callers only implement the actual upload/save in `onFile`.
 * Styled to match the surrounding admin action buttons via `className`.
 */
export function ImageUploadButton({
  label,
  onFile,
  icon,
  className,
  variant = "outline",
  disabled,
  accept = "image/png,image/jpeg,image/webp,image/gif",
}: {
  label: string
  onFile: (file: File) => Promise<void>
  icon?: React.ReactNode
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
  disabled?: boolean
  accept?: string
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [pending, setPending] = React.useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset immediately so picking the same file again still fires onChange.
    e.target.value = ""
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please choose an image under 5MB.", variant: "destructive" })
      return
    }

    setPending(true)
    try {
      await onFile(file)
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.response?.data?.message || "Could not upload the image.",
        variant: "destructive",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className={cn("h-4 w-4 animate-spin", "mr-2")} /> : (icon ?? <Upload className="mr-2 h-4 w-4" />)}
        {pending ? "Uploading…" : label}
      </Button>
    </>
  )
}
