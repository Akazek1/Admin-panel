"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate, isSelectingTextIn } from "@/lib/utils"
import { Check, CheckCheck, CheckCircle2, ExternalLink, Headset, Loader2, Pencil, Reply, RotateCcw, Search, Send, Settings, ShieldAlert, SmilePlus, StickyNote, Trash2, X } from "lucide-react"

type SupportStatus = "IDLE" | "NEEDS_REPLY" | "ANSWERED" | "RESOLVED"
type StatusFilter = "NEEDS_REPLY" | "ANSWERED" | "RESOLVED" | "ALL"

interface SupportUser {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  profilePicture: string | null
  preferredLanguage: string
}

interface ThreadSummary {
  id: string
  status: SupportStatus
  waitingSince: string | null
  lastMessageAt: string | null
  unreadCount: number
  hasNote: boolean
  user: SupportUser
  lastMessage: { content: string; createdAt: string; fromUser: boolean; staffDisplayName: string | null } | null
}

interface ThreadMessage {
  id: string
  content: string
  createdAt: string
  senderUserId: string | null
  staffDisplayName: string | null
  deletedAt: string | null
  editedAt: string | null
  isRead: boolean
  isDelivered: boolean
  replyTo: {
    id: string
    content: string
    deletedAt: string | null
    staffDisplayName: string | null
    senderUser: { id: string; firstName: string | null; lastName: string | null } | null
  } | null
  // A reaction with no userId is the support team's (one per message).
  reactions: { id: string; emoji: string; userId: string | null }[]
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface ThreadDetail {
  id: string
  status: SupportStatus
  user: SupportUser & {
    username: string | null
    isProvider: boolean
    accountType: string
    isVerified: boolean
    isBanned: boolean
    createdAt: string
    lastLoginAt: string | null
  }
  note: ThreadNote | null
  messages: ThreadMessage[]
}

interface ThreadNote {
  content: string
  updatedByName: string | null
  updatedAt: string
}

interface StaffMember {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  email: string | null
  isFullAdmin: boolean
  supportDisplayName: string | null
  canHandleSupport: boolean
}

interface WelcomeSettings {
  defaultContent: string
  messages: { locale: string; content: string | null; defaultContent: string }[]
}

const LANGUAGE_NAMES: Record<string, string> = { en: "English", rw: "Kinyarwanda" }
const languageName = (code?: string) => LANGUAGE_NAMES[code ?? ""] ?? code ?? "Unknown"

const TABS: { value: StatusFilter; label: string; countKey?: "needsReply" | "answered" | "resolved" }[] = [
  { value: "NEEDS_REPLY", label: "Needs reply", countKey: "needsReply" },
  { value: "ANSWERED", label: "Answered", countKey: "answered" },
  { value: "RESOLVED", label: "Resolved", countKey: "resolved" },
  { value: "ALL", label: "All" },
]

const unwrap = (res: { data: any }) => res.data?.data ?? res.data
const errorMessage = (err: any, fallback: string) => {
  const m = err?.response?.data?.message
  return (Array.isArray(m) ? m[0] : m) || fallback
}

function fullName(u?: { firstName: string | null; lastName: string | null } | null) {
  return `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Unnamed user"
}

function waitingFor(since: string | null) {
  if (!since) return ""
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 60000))
  if (minutes < 1) return "Waiting less than a minute"
  if (minutes < 60) return `Waiting ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Waiting ${hours} h`
  return `Waiting ${Math.floor(hours / 24)} d`
}

function UserAvatar({ user }: { user: SupportUser }) {
  if (user.profilePicture) {
    return <img src={user.profilePicture} alt="" className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-emerald-500/15 text-xs font-semibold text-emerald-200">
      {(user.firstName?.[0] ?? "U").toUpperCase()}
      {(user.lastName?.[0] ?? "").toUpperCase()}
    </div>
  )
}

function LanguageBadge({ code }: { code: string }) {
  return (
    <Badge variant="outline" className="shrink-0 border-violet-400/30 bg-violet-500/10 text-[10px] uppercase text-violet-200">
      {code}
    </Badge>
  )
}

function statusBadgeClass(status: SupportStatus) {
  if (status === "NEEDS_REPLY") return "bg-amber-500/10 text-amber-300"
  if (status === "ANSWERED") return "bg-emerald-500/10 text-emerald-300"
  return "bg-muted text-muted-foreground"
}

const STATUS_LABEL: Record<SupportStatus, string> = {
  IDLE: "Welcome sent · no reply yet",
  NEEDS_REPLY: "Needs reply",
  ANSWERED: "Answered",
  RESOLVED: "Resolved",
}

/**
 * The team's private note on a thread: context any admin picking it up should
 * have. Never sent to the user.
 */
function ThreadNoteBar({ threadId, note }: { threadId: string; note: ThreadNote | null }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  useEffect(() => {
    setEditing(false)
  }, [threadId])

  const save = useMutation({
    mutationFn: (content: string) => axiosInstance.put(`/admin/support/threads/${threadId}/note`, { content }),
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ["support-thread", threadId] })
      queryClient.invalidateQueries({ queryKey: ["support-threads"] })
    },
    onError: (err) => toast({ title: "Error", description: errorMessage(err, "Could not save the note."), variant: "destructive" }),
  })

  if (editing) {
    return (
      <div className="shrink-0 space-y-2 border-b border-white/5 bg-amber-500/5 px-4 py-3">
        <Label className="text-xs text-amber-200">Team note · only admins see this</Label>
        <Textarea
          autoFocus
          rows={3}
          maxLength={2000}
          className="border-white/10 bg-background/70 text-sm"
          placeholder="Context for whoever picks this up next"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={save.isPending || draft.trim() === (note?.content ?? "")} onClick={() => save.mutate(draft)}>
            {draft.trim() || !note ? "Save note" : "Remove note"}
          </Button>
        </div>
      </div>
    )
  }

  const startEditing = () => {
    setDraft(note?.content ?? "")
    setEditing(true)
  }

  if (!note) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="flex shrink-0 items-center gap-2 border-b border-white/5 px-4 py-2 text-left text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      >
        <StickyNote className="h-3.5 w-3.5" />
        Add a team note (only admins see it)
      </button>
    )
  }

  return (
    <div className="flex shrink-0 items-start gap-2 border-b border-white/5 bg-amber-500/5 px-4 py-2.5">
      <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap break-words text-sm text-amber-50">{note.content}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Team note{note.updatedByName ? ` · ${note.updatedByName}` : ""} · {formatDate(note.updatedAt)}
        </p>
      </div>
      <Button size="sm" variant="ghost" className="h-7 shrink-0 px-2 text-xs" onClick={startEditing}>
        Edit
      </Button>
    </div>
  )
}

/** Display names + welcome messages. Full admins only. */
function SupportSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const [names, setNames] = useState<Record<string, string>>({})
  const [welcome, setWelcome] = useState<Record<string, string>>({})
  const [contactPhone, setContactPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const { data: me } = useQuery<{ id: string }>({
    queryKey: ["support-me"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/me")),
    enabled: open,
  })

  const { data: staff } = useQuery<StaffMember[]>({
    queryKey: ["support-staff"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/staff")),
    enabled: open,
  })
  const { data: welcomeData } = useQuery<WelcomeSettings>({
    queryKey: ["support-welcome"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/welcome")),
    enabled: open,
  })
  // Public endpoint: the same value guests see in the app.
  const { data: contact } = useQuery<{ phone: string; isDefault: boolean }>({
    queryKey: ["support-contact-phone"],
    queryFn: async () => unwrap(await axiosInstance.get("/support/contact")),
    enabled: open,
  })

  useEffect(() => {
    if (staff) setNames(Object.fromEntries(staff.map((s) => [s.id, s.supportDisplayName ?? ""])))
  }, [staff])
  useEffect(() => {
    if (welcomeData) setWelcome(Object.fromEntries(welcomeData.messages.map((m) => [m.locale, m.content ?? ""])))
  }, [welcomeData])
  useEffect(() => {
    if (contact) setContactPhone(contact.phone)
  }, [contact])

  // Accounts created before support chat existed have no thread, so they
  // never got the welcome message.
  const { data: backfill } = useQuery<{ remaining: number }>({
    queryKey: ["support-welcome-backfill"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/welcome/backfill")),
    enabled: open,
  })

  const sendWelcomeToExisting = async () => {
    const total = backfill?.remaining ?? 0
    if (!total) return
    if (!window.confirm(`Send the welcome message to ${total} existing user${total === 1 ? "" : "s"}? This cannot be undone.`)) return
    setSendingWelcome(true)
    let sent = 0
    let failed = 0
    try {
      // The server works through one batch per request.
      for (let round = 0; round < 500; round++) {
        const res = unwrap(await axiosInstance.post("/admin/support/welcome/backfill", {})) as {
          created: number
          failed: number
          remaining: number
        }
        sent += res.created
        failed += res.failed
        queryClient.setQueryData(["support-welcome-backfill"], { remaining: res.remaining })
        // Stop when done, or when a batch made no progress (only failures left).
        if (res.remaining === 0 || res.created === 0) break
      }
      toast({
        title: `Welcome message sent to ${sent} user${sent === 1 ? "" : "s"}`,
        description: failed ? `${failed} could not be sent. Try again later.` : undefined,
        variant: failed ? "destructive" : undefined,
      })
    } catch (err) {
      toast({ title: "Error", description: errorMessage(err, `Stopped after ${sent} users.`), variant: "destructive" })
    } finally {
      setSendingWelcome(false)
      queryClient.invalidateQueries({ queryKey: ["support-welcome-backfill"] })
    }
  }

  // What the admin actually edited — one Save button sends just these.
  const changedNames = (staff ?? []).filter((s) => (names[s.id] ?? "").trim() !== (s.supportDisplayName ?? ""))
  const changedWelcome = (welcomeData?.messages ?? []).filter((m) => (welcome[m.locale] ?? "").trim() !== (m.content ?? ""))
  const phoneChanged = !!contact && contactPhone.trim() !== contact.phone
  const changeCount = changedNames.length + changedWelcome.length + (phoneChanged ? 1 : 0)

  const saveAll = async () => {
    setSaving(true)
    const failures: string[] = []
    const attempt = async (label: string, run: () => Promise<unknown>) => {
      try {
        await run()
      } catch (err) {
        failures.push(`${label}: ${errorMessage(err, "could not be saved")}`)
      }
    }
    for (const s of changedNames) {
      await attempt(`Display name for ${fullName(s)}`, () =>
        axiosInstance.put(`/admin/support/staff/${s.id}/display-name`, { displayName: names[s.id] ?? "" }),
      )
    }
    if (phoneChanged) {
      await attempt("Contact number", () => axiosInstance.put("/admin/support/contact-phone", { phone: contactPhone }))
    }
    for (const m of changedWelcome) {
      await attempt(`${languageName(m.locale)} welcome message`, () =>
        axiosInstance.put(`/admin/support/welcome/${m.locale}`, { content: welcome[m.locale] ?? "" }),
      )
    }
    // Reload whatever did save, so only the failed fields still show as edited.
    await Promise.all(
      ["support-staff", "support-me", "support-contact-phone", "support-welcome"].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
    setSaving(false)
    if (failures.length) {
      toast({ title: "Some changes were not saved", description: failures.join(" · "), variant: "destructive" })
    } else {
      toast({ title: "Support settings saved" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pb-3 pt-6">
          <DialogTitle>Support settings</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Display names</h3>
              <p className="text-xs text-muted-foreground">
                The name users see on each admin's replies, as "Name · Huza Support". An admin with no name can read
                threads but can't reply.
              </p>
            </div>
            {!staff ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {fullName(s)}
                      {s.id === me?.id && <span className="ml-1.5 text-xs font-semibold text-emerald-300">(you)</span>}
                    </p>
                    {/* Email or phone, so it is clear which real account each row is. */}
                    <p className="truncate text-xs text-muted-foreground">
                      {s.isFullAdmin ? "Admin" : s.canHandleSupport ? "Sub-admin" : "Sub-admin · no support permission"}
                      {" · "}
                      {s.email || s.phoneNumber}
                    </p>
                  </div>
                  <Input
                    className="h-9 w-56 border-white/10 bg-background/70"
                    placeholder="Display name"
                    maxLength={30}
                    value={names[s.id] ?? ""}
                    onChange={(e) => setNames((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                </div>
              ))
            )}
          </section>

          <section className="space-y-3 border-t border-white/5 pt-4">
            <div>
              <h3 className="text-sm font-semibold">Contact number for guests</h3>
              <p className="text-xs text-muted-foreground">
                Shown to people who are not signed in ("Trouble signing in? Call or WhatsApp us on…") on the home page,
                service pages, and the sign-in and sign-up screens. Use international format.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                className="h-9 w-56 border-white/10 bg-background/70"
                placeholder="+250789737838"
                maxLength={24}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
              {contact?.isDefault && !phoneChanged && <span className="text-xs text-muted-foreground">Default number</span>}
            </div>
          </section>

          <section className="space-y-3 border-t border-white/5 pt-4">
            <div>
              <h3 className="text-sm font-semibold">Welcome message</h3>
              <p className="text-xs text-muted-foreground">
                Sent to every new user in their app language. Use {"{name}"} for their first name and {"{phone}"} for
                the contact number above. A language left empty sends the built-in text shown in grey.
              </p>
            </div>
            {welcomeData?.messages.map((m) => (
              <div key={m.locale} className="space-y-1.5">
                <Label className="text-xs">{languageName(m.locale)}</Label>
                <Textarea
                  rows={3}
                  maxLength={1000}
                  className="border-white/10 bg-background/70"
                  placeholder={m.defaultContent}
                  value={welcome[m.locale] ?? ""}
                  onChange={(e) => setWelcome((prev) => ({ ...prev, [m.locale]: e.target.value }))}
                />
              </div>
            ))}
          </section>

          <section className="space-y-3 border-t border-white/5 pt-4">
            <div>
              <h3 className="text-sm font-semibold">Existing users</h3>
              <p className="text-xs text-muted-foreground">
                People who joined before support chat have no Huza Support conversation yet. This opens it for them
                with the welcome message in their language. They see one unread chat; no notification is sent. Save
                any changes above first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={!backfill?.remaining || sendingWelcome || saving || changeCount > 0}
                onClick={sendWelcomeToExisting}
              >
                {sendingWelcome && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send welcome message
              </Button>
              <span className="text-xs text-muted-foreground">
                {!backfill
                  ? "Checking…"
                  : backfill.remaining === 0
                    ? "Every user already has it"
                    : `${backfill.remaining} user${backfill.remaining === 1 ? "" : "s"} without it`}
              </span>
            </div>
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/5 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {changeCount === 0 ? "No unsaved changes" : `${changeCount} unsaved change${changeCount === 1 ? "" : "s"}`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button disabled={changeCount === 0 || saving} onClick={saveAll}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SupportInbox() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<StatusFilter>("NEEDS_REPLY")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listLimit, setListLimit] = useState(50)
  const [replyTarget, setReplyTarget] = useState<ThreadMessage | null>(null)
  const [editTarget, setEditTarget] = useState<ThreadMessage | null>(null)
  const [reactingTo, setReactingTo] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // The sidebar may already have the counts cached, which the server render
  // never does — show them only after mount so both renders match.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Reply / edit drafts belong to one thread.
  useEffect(() => {
    setReplyTarget(null)
    setEditTarget(null)
    setReactingTo(null)
    setMessageText("")
  }, [selectedId])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data: me } = useQuery<{ id: string; supportDisplayName: string | null; isFullAdmin: boolean }>({
    queryKey: ["support-me"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/me")),
  })

  const { data: counts } = useQuery<{ needsReply: number; answered: number; resolved: number; unreadUsers: number }>({
    queryKey: ["support-counts"],
    queryFn: async () => unwrap(await axiosInstance.get("/admin/support/counts")),
    refetchInterval: 15_000,
  })

  const { data: list, isLoading: loadingList } = useQuery<{ items: ThreadSummary[]; total: number }>({
    queryKey: ["support-threads", filter, debouncedSearch, listLimit],
    queryFn: async () =>
      unwrap(
        await axiosInstance.get("/admin/support/threads", {
          params: { status: filter, limit: listLimit, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
        }),
      ),
    refetchInterval: 10_000,
    // Keep the rows on screen while a longer page loads.
    placeholderData: (previous) => previous,
  })

  // A different tab or search starts again from the first page.
  useEffect(() => {
    setListLimit(50)
  }, [filter, debouncedSearch])

  const { data: detail, isLoading: loadingDetail } = useQuery<ThreadDetail>({
    queryKey: ["support-thread", selectedId],
    queryFn: async () => unwrap(await axiosInstance.get(`/admin/support/threads/${selectedId}`)),
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["support-threads"] })
    queryClient.invalidateQueries({ queryKey: ["support-counts"] })
    queryClient.invalidateQueries({ queryKey: ["support-thread", selectedId] })
  }

  // Arriving from a user's page (?user=<id>): open, or start, their thread.
  const userParam = searchParams.get("user")
  useEffect(() => {
    if (!userParam) return
    axiosInstance
      .post(`/admin/support/users/${userParam}/thread`)
      .then((res) => {
        setSelectedId(unwrap(res).id)
        setFilter("ALL")
      })
      .catch((err) => toast({ title: "Error", description: errorMessage(err, "Could not open the thread."), variant: "destructive" }))
      .finally(() => router.replace("/admin/support"))
  }, [userParam, router])

  // Opening a thread (or a new user message landing in the open one) marks it
  // read for the whole team.
  const lastUserMessageId = [...(detail?.messages ?? [])].reverse().find((m) => m.senderUserId)?.id
  useEffect(() => {
    if (!selectedId || !lastUserMessageId) return
    axiosInstance
      .post(`/admin/support/threads/${selectedId}/read`)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["support-threads"] })
        queryClient.invalidateQueries({ queryKey: ["support-counts"] })
      })
      .catch(() => undefined)
  }, [selectedId, lastUserMessageId, queryClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [detail?.messages?.length, selectedId])

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      editTarget
        ? axiosInstance.patch(`/admin/support/messages/${editTarget.id}`, { content })
        : axiosInstance.post(`/admin/support/threads/${selectedId}/messages`, {
            content,
            ...(replyTarget ? { replyToId: replyTarget.id } : {}),
          }),
    onSuccess: () => {
      setMessageText("")
      setReplyTarget(null)
      setEditTarget(null)
      refresh()
    },
    onError: (err) => toast({ title: "Error", description: errorMessage(err, "Send failed."), variant: "destructive" }),
  })

  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      axiosInstance.post(`/admin/support/messages/${messageId}/reaction`, { emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-thread", selectedId] }),
    onError: (err) => toast({ title: "Error", description: errorMessage(err, "Could not react."), variant: "destructive" }),
  })

  const unsendMutation = useMutation({
    mutationFn: (messageId: string) => axiosInstance.delete(`/admin/support/messages/${messageId}`),
    onSuccess: () => refresh(),
    onError: (err) => toast({ title: "Error", description: errorMessage(err, "Could not unsend."), variant: "destructive" }),
  })

  const startReply = (msg: ThreadMessage) => {
    setEditTarget(null)
    setReplyTarget(msg)
    inputRef.current?.focus()
  }
  const startEdit = (msg: ThreadMessage) => {
    setReplyTarget(null)
    setEditTarget(msg)
    setMessageText(msg.content)
    inputRef.current?.focus()
  }
  const cancelDraftMode = () => {
    if (editTarget) setMessageText("")
    setReplyTarget(null)
    setEditTarget(null)
  }
  const authorOf = (m: { senderUser?: unknown; senderUserId?: string | null; staffDisplayName: string | null }) =>
    m.senderUser || m.senderUserId ? fullName(detail?.user) : m.staffDisplayName ?? "Huza Support"

  const resolveMutation = useMutation({
    mutationFn: (resolved: boolean) =>
      axiosInstance.post(`/admin/support/threads/${selectedId}/${resolved ? "resolve" : "reopen"}`),
    onSuccess: (_res, resolved) => {
      toast({ title: resolved ? "Marked as resolved" : "Thread reopened" })
      refresh()
    },
    onError: (err) => toast({ title: "Error", description: errorMessage(err, "Could not update the thread."), variant: "destructive" }),
  })

  const handleSend = () => {
    const text = messageText.trim()
    if (!text || !selectedId || sendMutation.isPending) return
    sendMutation.mutate(text)
  }

  const canReply = !!me?.supportDisplayName
  const threads = list?.items ?? []

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col gap-4 bg-[#101211] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Messages between users and the Huza team. Any admin can reply; the user sees one conversation.
          </p>
        </div>
        {me?.isFullAdmin && (
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Support settings
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Queue */}
        <aside className="flex w-[360px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
          <div className="space-y-2.5 border-b border-white/5 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="h-9 border-white/10 bg-background/70 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((tab) => {
                const count = mounted && tab.countKey ? counts?.[tab.countKey] : undefined
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilter(tab.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      filter === tab.value
                        ? "bg-[#145B10] text-white"
                        : "bg-background/60 text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    {count ? <span className="ml-1.5 opacity-80">{count}</span> : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : threads.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {debouncedSearch
                  ? "No thread matches this search."
                  : filter === "NEEDS_REPLY"
                    ? "Nobody is waiting for a reply."
                    : "Nothing here yet."}
              </p>
            ) : (
              threads.map((thread) => (
                // A div, not a <button>: browsers don't let you select text inside
                // a button, and admins need to copy names from this list.
                <div
                  key={thread.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    if (isSelectingTextIn(e.currentTarget)) return
                    setSelectedId(thread.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedId(thread.id)
                    }
                  }}
                  className={cn(
                    "w-full cursor-pointer select-text border-b border-white/5 px-3 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-emerald-500/50",
                    selectedId === thread.id && "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar user={thread.user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("truncate text-sm", thread.unreadCount ? "font-bold" : "font-semibold")}>
                          {fullName(thread.user)}
                        </p>
                        <LanguageBadge code={thread.user.preferredLanguage} />
                        {thread.hasNote && (
                          <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-label="Has a team note" />
                        )}
                        {thread.unreadCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none text-black">
                            {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className={cn("mt-1 truncate text-xs", thread.unreadCount ? "text-foreground" : "text-muted-foreground")}>
                        {thread.lastMessage?.content || "No messages yet"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {thread.status === "NEEDS_REPLY"
                          ? waitingFor(thread.waitingSince)
                          : thread.status === "ANSWERED" && thread.lastMessage?.staffDisplayName
                            ? `Answered by ${thread.lastMessage.staffDisplayName}`
                            : STATUS_LABEL[thread.status]}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {!loadingList && (list?.total ?? 0) > threads.length && (
              <button
                type="button"
                onClick={() => setListLimit((n) => n + 50)}
                className="w-full px-3 py-3 text-center text-xs font-medium text-emerald-300 hover:bg-white/[0.04]"
              >
                Show more ({(list?.total ?? 0) - threads.length} more)
              </button>
            )}
          </div>
        </aside>

        {/* Thread */}
        {!selectedId ? (
          <section className="flex flex-1 items-center justify-center rounded-lg border border-white/5 bg-card/70">
            <div className="text-center text-muted-foreground">
              <Headset className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Select a thread</p>
              <p className="text-sm">Choose a user from the list to read and reply.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{detail ? fullName(detail.user) : "Loading..."}</p>
                  {detail && (
                    <p className="text-xs text-muted-foreground">
                      Uses the app in {languageName(detail.user.preferredLanguage)}
                    </p>
                  )}
                </div>
                {detail && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={cn("text-[10px]", statusBadgeClass(detail.status))}>{STATUS_LABEL[detail.status]}</Badge>
                    {detail.status === "RESOLVED" ? (
                      <Button size="sm" variant="outline" disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate(false)}>
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Reopen
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate(true)}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark resolved
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {detail && <ThreadNoteBar threadId={detail.id} note={detail.note} />}

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingDetail ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {detail?.messages.map((msg) => {
                      const fromUser = !!msg.senderUserId
                      const deleted = !!msg.deletedAt
                      // Only replies the team wrote can be edited or unsent.
                      const canModify = !fromUser && !!msg.staffDisplayName && !deleted
                      const teamReaction = msg.reactions.find((r) => !r.userId)?.emoji
                      const reactionCounts = msg.reactions.reduce<Record<string, number>>((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
                        return acc
                      }, {})
                      const actions = !deleted && (
                        <div className="relative flex shrink-0 items-center gap-0.5 self-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="React"
                            onClick={() => setReactingTo(reactingTo === msg.id ? null : msg.id)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                          >
                            <SmilePlus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Reply"
                            onClick={() => startReply(msg)}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                          >
                            <Reply className="h-4 w-4" />
                          </button>
                          {canModify && (
                            <>
                              <button
                                type="button"
                                aria-label="Edit"
                                onClick={() => startEdit(msg)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Unsend"
                                disabled={unsendMutation.isPending}
                                onClick={() => {
                                  if (window.confirm("Unsend this reply? The user will see it as deleted.")) {
                                    unsendMutation.mutate(msg.id)
                                  }
                                }}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {reactingTo === msg.id && (
                            <div
                              className={cn(
                                "absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-white/10 bg-popover px-1.5 py-1 shadow-lg",
                                fromUser ? "left-0" : "right-0",
                              )}
                            >
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    reactMutation.mutate({ messageId: msg.id, emoji })
                                    setReactingTo(null)
                                  }}
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-lg leading-none hover:bg-white/10",
                                    teamReaction === emoji && "bg-emerald-500/20",
                                  )}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                      return (
                        <div key={msg.id} className={cn("group flex items-start gap-1", fromUser ? "justify-start" : "justify-end")}>
                          {!fromUser && actions}
                          <div className="max-w-[70%]">
                            <div
                              className={cn(
                                "whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm",
                                fromUser ? "bg-background/70 text-foreground" : "bg-emerald-600 text-white",
                                deleted && "italic opacity-60",
                              )}
                            >
                              {msg.replyTo && !deleted && (
                                <div
                                  className={cn(
                                    "mb-1.5 rounded-md border-l-2 px-2 py-1 text-xs",
                                    fromUser ? "border-emerald-400 bg-white/5" : "border-white/70 bg-black/15",
                                  )}
                                >
                                  <p className="font-semibold">{authorOf(msg.replyTo)}</p>
                                  <p className="line-clamp-2 opacity-80">
                                    {msg.replyTo.deletedAt ? "Message deleted" : msg.replyTo.content}
                                  </p>
                                </div>
                              )}
                              {deleted ? "Message deleted" : msg.content}
                            </div>
                            {Object.keys(reactionCounts).length > 0 && (
                              <div className={cn("mt-1 flex flex-wrap gap-1", !fromUser && "justify-end")}>
                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                  <span
                                    key={emoji}
                                    className="rounded-full border border-white/10 bg-background/70 px-1.5 py-0.5 text-xs"
                                  >
                                    {emoji}
                                    {count > 1 ? ` ${count}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className={cn("mt-1 text-xs text-muted-foreground", !fromUser && "text-right")}>
                              {fromUser ? fullName(detail.user) : msg.staffDisplayName ?? "Welcome message"} ·{" "}
                              {formatDate(msg.createdAt)}
                              {msg.editedAt && !deleted ? " · edited" : ""}
                              {/* Has the user's phone got it / have they opened it — same ticks as the app. */}
                              {!fromUser && !deleted && (
                                <span
                                  className={cn(
                                    "ml-1.5 inline-flex items-center gap-1 align-middle",
                                    msg.isRead ? "text-sky-400" : "text-muted-foreground",
                                  )}
                                >
                                  {msg.isRead || msg.isDelivered ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  {msg.isRead ? "Read" : msg.isDelivered ? "Delivered" : "Sent"}
                                </span>
                              )}
                            </p>
                          </div>
                          {fromUser && actions}
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-white/5 p-4">
                {me && !canReply ? (
                  <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="flex-1">
                      {me.isFullAdmin
                        ? "You need a display name before you can reply. It is the name users see on your messages."
                        : "You can't reply yet: ask a full admin to set your support display name."}
                    </span>
                    {me.isFullAdmin && (
                      <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setSettingsOpen(true)}>
                        Set display name
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {(replyTarget || editTarget) && (
                      <div className="mb-2 flex items-start gap-2 rounded-md border-l-2 border-emerald-400 bg-white/5 px-3 py-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {editTarget ? "Editing your reply" : `Replying to ${authorOf(replyTarget!)}`}
                          </p>
                          <p className="truncate text-muted-foreground">{(editTarget ?? replyTarget)!.content}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Cancel"
                          onClick={cancelDraftMode}
                          className="rounded p-0.5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        placeholder={me?.supportDisplayName ? `Reply as ${me.supportDisplayName}` : "Type a reply"}
                        className="border-white/10 bg-background/70"
                        value={messageText}
                        maxLength={2000}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) handleSend()
                          if (e.key === "Escape") cancelDraftMode()
                        }}
                      />
                      <Button onClick={handleSend} disabled={!messageText.trim() || sendMutation.isPending} aria-label="Send">
                        {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    {me?.supportDisplayName && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        The user sees this as "{me.supportDisplayName} · Huza Support".
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* User */}
            <aside className="hidden w-[250px] shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-white/5 bg-card/70 p-4 xl:flex">
              {detail && (
                <>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={detail.user} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{fullName(detail.user)}</p>
                      {detail.user.username && <p className="truncate text-xs text-muted-foreground">@{detail.user.username}</p>}
                    </div>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd>{detail.user.phoneNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">App language</dt>
                      <dd>{languageName(detail.user.preferredLanguage)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Account</dt>
                      <dd>
                        {detail.user.accountType === "COMPANY" ? "Company" : detail.user.isProvider ? "Provider" : "Individual"}
                        {detail.user.isVerified ? " · verified" : ""}
                        {detail.user.isBanned ? " · banned" : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Joined</dt>
                      <dd>{formatDate(detail.user.createdAt)}</dd>
                    </div>
                    {detail.user.lastLoginAt && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Last login</dt>
                        <dd>{formatDate(detail.user.lastLoginAt)}</dd>
                      </div>
                    )}
                  </dl>
                  <Link
                    href={`/admin/users/${detail.user.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:underline"
                  >
                    Open user profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </aside>
          </>
        )}
      </div>

      {me?.isFullAdmin && <SupportSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  )
}

export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportInbox />
    </Suspense>
  )
}
