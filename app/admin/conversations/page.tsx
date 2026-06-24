"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Archive, BriefcaseBusiness, Clock3, Loader2, Lock, MapPin, MessageSquare, RotateCcw, Search, Send, ShieldAlert, UserRound } from "lucide-react"

interface Participant {
  id: string
  firstName: string | null
  lastName: string | null
  profilePicture: string | null
}

interface ConversationSummary {
  id: string
  status: string
  chatStatus?: string
  chatDisabledReason?: string | null
  chatDisabledUntil?: string | null
  employer: Participant
  worker: Participant
  service?: { id: string; title: string; category?: { id: string; name: string } } | null
  job?: { id: string; title: string; category?: { id: string; name: string } } | null
  address?: { city: string; district?: string | null; sector?: string | null } | null
  messages: { content: string; createdAt: string }[]
  _count: { messages: number }
  updatedAt: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: Participant & { roles: string[] }
}

interface ConversationDetail {
  id: string
  employer: Participant
  worker: Participant
  messages: Message[]
  status: string
  chatStatus?: string
  chatDisabledReason?: string | null
  chatDisabledUntil?: string | null
  service?: { id: string; title: string; category?: { id: string; name: string } } | null
  job?: { id: string; title: string; category?: { id: string; name: string } } | null
  address?: { city: string; district?: string | null; sector?: string | null } | null
}

function initials(p: Participant) {
  return [p.firstName, p.lastName].filter(Boolean).map(s => s![0]).join("").toUpperCase() || "?"
}

function fullName(p: Participant) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown"
}

function isAdmin(roles: string[]) {
  return roles.includes("ADMIN") || roles.includes("SUB_ADMIN")
}

function bookingTitle(c?: Pick<ConversationSummary, "service" | "job"> | Pick<ConversationDetail, "service" | "job"> | null) {
  return c?.service?.title || c?.job?.title || "Direct booking"
}

function categoryName(c?: Pick<ConversationSummary, "service" | "job"> | Pick<ConversationDetail, "service" | "job"> | null) {
  return c?.service?.category?.name || c?.job?.category?.name || "Uncategorized"
}

function locationText(c?: Pick<ConversationSummary, "address"> | Pick<ConversationDetail, "address"> | null) {
  const address = c?.address
  if (!address) return "No location"
  return [address.sector, address.district, address.city].filter(Boolean).join(", ") || "No location"
}

function Avatar({ participant, size = "md", tone = "neutral" }: { participant: Participant; size?: "sm" | "md" | "lg"; tone?: "neutral" | "green" | "blue" | "amber" }) {
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"
  const toneClass = {
    neutral: "bg-muted text-foreground",
    green: "bg-emerald-500/15 text-emerald-200",
    blue: "bg-sky-500/15 text-sky-200",
    amber: "bg-amber-500/15 text-amber-100",
  }
  if (participant.profilePicture) {
    return <img src={participant.profilePicture} alt="" className={cn(sizeClass, "shrink-0 rounded-full border border-white/10 object-cover")} />
  }
  return (
    <div className={cn(sizeClass, "flex shrink-0 items-center justify-center rounded-full border border-white/10 font-semibold", toneClass[tone])}>
      {initials(participant)}
    </div>
  )
}

function statusBadge(status?: string) {
  if (status === "COMPLETED") return "bg-emerald-500/10 text-emerald-300"
  if (status === "CANCELLED") return "bg-red-500/10 text-red-300"
  if (status === "IN_PROGRESS") return "bg-sky-500/10 text-sky-300"
  if (status === "CONFIRMED") return "bg-amber-500/10 text-amber-300"
  return "bg-muted text-muted-foreground"
}

function chatBadge(status?: string) {
  if (!status || status === "ACTIVE") return "bg-emerald-500/10 text-emerald-300"
  if (status === "ARCHIVED") return "bg-muted text-muted-foreground"
  return "bg-red-500/10 text-red-300"
}

export default function ConversationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [chatFilter, setChatFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [locationFilter, setLocationFilter] = useState("")
  const [moderationOpen, setModerationOpen] = useState(false)
  const [moderationAction, setModerationAction] = useState<"TEMPORARILY_DISABLED" | "PERMANENTLY_DISABLED" | "ARCHIVED" | "ACTIVE">("TEMPORARILY_DISABLED")
  const [moderationReason, setModerationReason] = useState("")
  const [disabledUntil, setDisabledUntil] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data: categories } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-categories-for-conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/categories")
      const result = res.data?.data ?? res.data
      return Array.isArray(result) ? result : (result?.data ?? [])
    },
  })

  const { data: conversations, isLoading: loadingList } = useQuery<ConversationSummary[]>({
    queryKey: ["admin-conversations", debouncedSearch, statusFilter, chatFilter, categoryFilter, locationFilter],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/conversations", {
        params: {
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
          ...(chatFilter !== "ALL" ? { chatStatus: chatFilter } : {}),
          ...(categoryFilter !== "ALL" ? { categoryId: categoryFilter } : {}),
          ...(locationFilter ? { location: locationFilter } : {}),
        },
      })
      return res.data?.data ?? res.data
    },
  })

  const { data: detail, isLoading: loadingDetail } = useQuery<ConversationDetail>({
    queryKey: ["admin-conversation-detail", selectedId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/conversations/${selectedId}/messages`)
      return res.data?.data ?? res.data
    },
    enabled: !!selectedId,
    refetchInterval: 5000,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [detail?.messages?.length])

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      axiosInstance.post(`/admin/conversations/${selectedId}/message`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversation-detail", selectedId] })
      setMessageText("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Send failed.", variant: "destructive" })
    },
  })

  const moderationMutation = useMutation({
    mutationFn: () =>
      axiosInstance.patch(`/admin/conversations/${selectedId}/moderation`, {
        chatStatus: moderationAction,
        reason: moderationReason,
        disabledUntil: disabledUntil || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] })
      queryClient.invalidateQueries({ queryKey: ["admin-conversation-detail", selectedId] })
      toast({ title: "Conversation updated" })
      setModerationOpen(false)
      setModerationReason("")
      setDisabledUntil("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update conversation.", variant: "destructive" })
    },
  })

  const handleSend = () => {
    const msg = messageText.trim()
    if (!msg || !selectedId) return
    sendMutation.mutate(msg)
  }

  const selected = conversations?.find(c => c.id === selectedId)
  const selectedConversation = detail || selected

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col gap-4 bg-[#101211] p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Conversations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor chats between users. Your messages appear labeled as Support.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Sidebar list */}
        <aside className="flex w-[390px] shrink-0 flex-col overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
          <div className="border-b border-white/5 p-3">
            <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, service, or location..."
                className="h-9 border-white/10 bg-background/70 pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue placeholder="Booking" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All bookings</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={chatFilter} onValueChange={setChatFilter}>
                <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue placeholder="Chat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All chats</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="TEMPORARILY_DISABLED">Paused</SelectItem>
                  <SelectItem value="PERMANENTLY_DISABLED">Disabled</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {(categories ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input className="h-9 border-white/10 bg-background/70" placeholder="Location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
            </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !conversations?.length ? (
              <p className="text-sm text-muted-foreground text-center py-10">No conversations found.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "w-full border-b border-white/5 px-3 py-3 text-left transition-colors hover:bg-white/[0.04]",
                    selectedId === c.id && "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/25"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Avatar participant={c.employer} tone="green" />
                      <div className="absolute -bottom-1 -right-1">
                        <Avatar participant={c.worker} size="sm" tone="blue" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{fullName(c.employer)}</p>
                          <p className="truncate text-xs text-muted-foreground">with {fullName(c.worker)}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-white/10 bg-background/50 text-xs">{c._count.messages}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge className={cn("text-[10px]", chatBadge(c.chatStatus))}>{c.chatStatus || "ACTIVE"}</Badge>
                        <Badge className={cn("text-[10px]", statusBadge(c.status))}>{c.status}</Badge>
                        {(c.service?.category || c.job?.category) && (
                          <Badge variant="outline" className="border-white/10 bg-background/40 text-[10px]">{categoryName(c)}</Badge>
                        )}
                      </div>
                      <p className="mt-2 truncate text-xs font-medium text-foreground/80">{bookingTitle(c)}</p>
                      {c.messages[0] && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{c.messages[0].content}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Message panel */}
        {!selectedId ? (
          <section className="flex flex-1 items-center justify-center rounded-lg border border-white/5 bg-card/70">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose one from the list to view messages.</p>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            {/* Chat header */}
            <div className="shrink-0 border-b border-white/5 p-4">
              {selected && (
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Avatar participant={selected.employer} size="lg" tone="green" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{fullName(selected.employer)}</p>
                        <p className="text-xs text-muted-foreground">Employer</p>
                      </div>
                      <span className="text-muted-foreground">↔</span>
                      <Avatar participant={selected.worker} size="lg" tone="blue" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold">{fullName(selected.worker)}</p>
                        <p className="text-xs text-muted-foreground">Provider</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" /> {bookingTitle(selectedConversation)}</span>
                      <span>{categoryName(selectedConversation)}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {locationText(selectedConversation)}</span>
                      <span>Booking ID: {selected.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusBadge(selected.status)}>{selected.status}</Badge>
                    <Badge className={chatBadge(selectedConversation?.chatStatus)}>{selectedConversation?.chatStatus || "ACTIVE"}</Badge>
                    <div className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Monitoring mode
                    </div>
                    <Button
                      className="h-9 border-white/10 bg-background/60"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModerationAction("TEMPORARILY_DISABLED")
                        setModerationOpen(true)
                      }}
                    >
                      <Lock className="mr-1.5 h-3.5 w-3.5" /> Disable Chat
                    </Button>
                    <Button
                      className="h-9 border-white/10 bg-background/60"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModerationAction("ARCHIVED")
                        setModerationOpen(true)
                      }}
                    >
                      <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
                    </Button>
                    {selectedConversation?.chatStatus !== "ACTIVE" && (
                      <Button
                        className="h-9 border-white/10 bg-background/60"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModerationAction("ACTIVE")
                          setModerationReason("")
                          setDisabledUntil("")
                          setModerationOpen(true)
                        }}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {selectedConversation?.chatDisabledReason && (
                <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  Reason: {selectedConversation.chatDisabledReason}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingDetail ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : !detail?.messages?.length ? (
                <p className="text-center text-muted-foreground py-10">No messages yet.</p>
              ) : (
                <>
                  {detail.messages.map((msg) => {
                    const isAdminMsg = isAdmin(msg.sender?.roles ?? [])
                    const isEmployer = msg.senderId === detail.employer.id
                    const senderName = isAdminMsg
                      ? "Support"
                      : fullName(msg.sender)

                    return (
                      <div
                        key={msg.id}
                        className={cn("flex gap-2", isAdminMsg ? "justify-center" : isEmployer ? "justify-end" : "justify-start")}
                      >
                        {!isAdminMsg && !isEmployer && (
                          <Avatar participant={msg.sender} size="sm" tone="blue" />
                        )}
                        <div className={cn("max-w-[70%]", isAdminMsg && "w-full max-w-[760px]")}>
                          {isAdminMsg ? (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm">
                              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" />
                              <span className="font-medium text-amber-100">[Support] {msg.content}</span>
                            </div>
                          ) : (
                            <div className={cn("rounded-xl px-3 py-2 text-sm", isEmployer ? "bg-emerald-600 text-white" : "bg-background/70 text-foreground")}>
                              <p>{msg.content}</p>
                            </div>
                          )}
                          <p className={cn("mt-1 text-xs text-muted-foreground", isEmployer && "text-right")}>
                            {senderName} · {formatDate(msg.createdAt)}
                          </p>
                        </div>
                        {isEmployer && (
                          <Avatar participant={msg.sender} size="sm" tone="green" />
                        )}
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/5 p-4">
              <div className="mb-2 flex w-fit items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                <ShieldAlert className="h-3 w-3" />
                Your message will appear as "Support" to both users
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a support message…"
                  className="border-white/10 bg-background/70"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <Button onClick={handleSend} disabled={!messageText.trim() || sendMutation.isPending}>
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog open={moderationOpen} onOpenChange={setModerationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversation Moderation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={moderationAction} onValueChange={(value) => setModerationAction(value as typeof moderationAction)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEMPORARILY_DISABLED">Temporarily disable chat</SelectItem>
                  <SelectItem value="PERMANENTLY_DISABLED">Permanently disable chat</SelectItem>
                  <SelectItem value="ARCHIVED">Move to archive</SelectItem>
                  <SelectItem value="ACTIVE">Restore chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {moderationAction === "TEMPORARILY_DISABLED" && (
              <div className="space-y-2">
                <Label>Disabled until</Label>
                <Input type="datetime-local" value={disabledUntil} onChange={(e) => setDisabledUntil(e.target.value)} />
              </div>
            )}
            {moderationAction !== "ACTIVE" && (
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea rows={3} value={moderationReason} onChange={(e) => setModerationReason(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModerationOpen(false)}>Cancel</Button>
            <Button onClick={() => moderationMutation.mutate()} disabled={moderationMutation.isPending || (moderationAction !== "ACTIVE" && !moderationReason.trim())}>
              {moderationMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
