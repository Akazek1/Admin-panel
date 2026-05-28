"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Loader2, Search, MessageSquare, Send, ShieldAlert, Archive, Lock, RotateCcw } from "lucide-react"

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
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor chats between users. Your messages appear labeled as Support.
        </p>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar list */}
        <Card className="w-80 shrink-0 flex flex-col">
          <CardHeader className="pb-2">
            <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Booking" /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Chat" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All chats</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="TEMPORARILY_DISABLED">Paused</SelectItem>
                  <SelectItem value="PERMANENTLY_DISABLED">Disabled</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {(categories ?? []).map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Filter location..." value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
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
                  className={`w-full text-left p-4 border-b transition-colors hover:bg-muted/50 ${selectedId === c.id ? "bg-muted" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(c.employer)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fullName(c.employer)}</p>
                      <p className="text-xs text-muted-foreground truncate">↔ {fullName(c.worker)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{c._count.messages}</Badge>
                  </div>
                  <div className="mb-1 flex flex-wrap gap-1">
                    <Badge variant={c.chatStatus === "ACTIVE" || !c.chatStatus ? "secondary" : "destructive"} className="text-[10px]">
                      {c.chatStatus || "ACTIVE"}
                    </Badge>
                    {(c.service?.category || c.job?.category) && (
                      <Badge variant="outline" className="text-[10px]">{c.service?.category?.name || c.job?.category?.name}</Badge>
                    )}
                  </div>
                  {c.messages[0] && (
                    <p className="text-xs text-muted-foreground truncate">{c.messages[0].content}</p>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Message panel */}
        {!selectedId ? (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose one from the list to view messages.</p>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Chat header */}
            <CardHeader className="pb-3 border-b shrink-0">
              {selected && (
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {fullName(selected.employer)} ↔ {fullName(selected.worker)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Booking ID: {selected.id.slice(0, 8)}…</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selected.status === "COMPLETED" ? "default" : selected.status === "CANCELLED" ? "destructive" : "secondary"}>
                      {selected.status}
                    </Badge>
                    <Badge variant={selectedConversation?.chatStatus === "ACTIVE" || !selectedConversation?.chatStatus ? "outline" : "destructive"}>
                      {selectedConversation?.chatStatus || "ACTIVE"}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                      <ShieldAlert className="w-3 h-3 text-yellow-600" />
                      <span className="text-yellow-700">Monitoring mode</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModerationAction("TEMPORARILY_DISABLED")
                        setModerationOpen(true)
                      }}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" /> Disable
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModerationAction("ARCHIVED")
                        setModerationOpen(true)
                      }}
                    >
                      <Archive className="w-3.5 h-3.5 mr-1.5" /> Archive
                    </Button>
                    {selectedConversation?.chatStatus !== "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setModerationAction("ACTIVE")
                          setModerationReason("")
                          setDisabledUntil("")
                          setModerationOpen(true)
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {selectedConversation && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{selectedConversation.service?.title || selectedConversation.job?.title || "Direct booking"}</span>
                  {(selectedConversation.service?.category || selectedConversation.job?.category) && (
                    <span>{selectedConversation.service?.category?.name || selectedConversation.job?.category?.name}</span>
                  )}
                  {selectedConversation.address && (
                    <span>{[selectedConversation.address.sector, selectedConversation.address.district, selectedConversation.address.city].filter(Boolean).join(", ")}</span>
                  )}
                  {selectedConversation.chatDisabledReason && <span>Reason: {selectedConversation.chatDisabledReason}</span>}
                </div>
              )}
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
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
                        className={`flex gap-2 ${isAdminMsg ? "justify-center" : isEmployer ? "justify-end" : "justify-start"}`}
                      >
                        {!isAdminMsg && !isEmployer && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                            {initials(msg.sender)}
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isAdminMsg ? "w-full" : ""}`}>
                          {isAdminMsg ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-center">
                              <ShieldAlert className="w-4 h-4 text-yellow-600 shrink-0" />
                              <span className="text-yellow-800 font-medium">[Support] {msg.content}</span>
                            </div>
                          ) : (
                            <div className={`px-3 py-2 rounded-xl text-sm ${isEmployer ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              <p>{msg.content}</p>
                            </div>
                          )}
                          <p className={`text-xs text-muted-foreground mt-1 ${isEmployer ? "text-right" : ""}`}>
                            {senderName} · {formatDate(msg.createdAt)}
                          </p>
                        </div>
                        {isEmployer && (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                            {initials(msg.sender)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </>
              )}
            </CardContent>

            {/* Input */}
            <div className="border-t p-4 shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 w-fit">
                <ShieldAlert className="w-3 h-3 text-yellow-600" />
                <span className="text-yellow-700">Your message will appear as "Support" to both users</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a support message…"
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                />
                <Button onClick={handleSend} disabled={!messageText.trim() || sendMutation.isPending}>
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
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
