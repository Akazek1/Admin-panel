"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A thumbnail image that opens a large, centered view of itself in an overlay
 * when clicked. The thumbnail keeps whatever className is passed so existing
 * designs are unchanged — only the click-to-zoom behavior is added.
 */
export function ImageLightbox({
  src,
  alt = "",
  className,
  thumbClassName,
}: {
  src: string
  alt?: string
  className?: string
  thumbClassName?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <img
          src={src}
          alt={alt}
          className={cn("cursor-zoom-in", thumbClassName ?? className)}
        />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onClick={() => setOpen(false)}
        >
          <DialogPrimitive.Title className="sr-only">{alt || "Image preview"}</DialogPrimitive.Title>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
          <DialogPrimitive.Close className="absolute -right-3 -top-3 rounded-full bg-white/90 p-1.5 text-black shadow-md ring-offset-background transition hover:bg-white focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
