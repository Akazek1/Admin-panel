"use client"

import { Fragment, useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { tokenizeChatLinks } from "@/lib/chat-links"

/**
 * Renders chat message text with any links made clickable (new tab). A link
 * that hides where it goes asks first and shows the real destination — staff
 * accounts are the most valuable phishing target on the platform.
 *
 * Same detection rules as the user app: see lib/chat-links.ts.
 */
export function LinkifiedText({ text, onColor = false }: { text: string; onColor?: boolean }) {
  const tokens = useMemo(() => tokenizeChatLinks(text), [text])
  const [pending, setPending] = useState<{ href: string; host: string } | null>(null)

  return (
    <>
      {tokens.map((token, i) =>
        token.type === "text" ? (
          <Fragment key={i}>{token.text}</Fragment>
        ) : (
          <a
            key={i}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!token.suspicious) return
              e.preventDefault()
              setPending({ href: token.href, host: token.host })
            }}
            className={cn("break-all underline underline-offset-2", onColor ? "text-white" : "text-emerald-600 dark:text-emerald-400")}
          >
            {token.text}
          </a>
        ),
      )}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check this link before you open it</AlertDialogTitle>
            <AlertDialogDescription>
              This link goes to <span className="break-all font-semibold text-foreground">{pending?.host}</span>. It is
              written in a way that can hide where it really leads. Only open it if you are sure it is safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Don&apos;t open</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pending && window.open(pending.href, "_blank", "noopener,noreferrer")}
            >
              Open anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
