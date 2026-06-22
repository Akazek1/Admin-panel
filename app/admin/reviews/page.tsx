"use client"

import React, { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle,
  ChevronsUpDown,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  MessageSquareReply,
  Search,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react"
import { deleteReview, getReviews, updateReview } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

interface ReviewUser {
  firstName: string | null
  lastName: string | null
}

interface AdminReview {
  id: string
  rating: number | null
  wouldRehire?: "YES" | "MAYBE" | "NO" | null
  comment: string | null
  reply?: string | null
  replyHidden?: boolean
  replyHiddenReason?: string | null
  replyHiddenAt?: string | null
  repliedAt?: string | null
  replyUpdatedAt?: string | null
  isHidden?: boolean
  hiddenReason?: string | null
  editedByAdminAt?: string | null
  createdAt: string
  author: ReviewUser
  target: ReviewUser
  booking?: { id: string } | null
  service?: { id: string; title: string; category?: { id: string; name: string } | null } | null
}

type VisibilityFilter = "ALL" | "VISIBLE" | "HIDDEN"
type RepeatFilter = "ALL" | "YES" | "MAYBE" | "NO" | "HAS_REPLY" | "NO_REPLY"
type SortMode = "NEWEST" | "OLDEST" | "REPEAT_POSITIVE" | "REPEAT_NEGATIVE" | "REVIEWER_ASC" | "REVIEWER_DESC" | "TARGET_ASC" | "TARGET_DESC"

function displayName(user?: ReviewUser) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown user"
}

function initials(user?: ReviewUser) {
  return displayName(user)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function relativeTime(value?: string | null) {
  if (!value) return "-"
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "-"
  const diff = Date.now() - time
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function reviewType(review: AdminReview) {
  return `${displayName(review.author)} reviewed ${displayName(review.target)}`
}

function repeatValue(review: AdminReview): "YES" | "MAYBE" | "NO" | "UNKNOWN" {
  return review.wouldRehire ?? "UNKNOWN"
}

function repeatLabel(review: AdminReview) {
  const value = repeatValue(review)
  if (value === "YES") return "Yes"
  if (value === "MAYBE") return "Maybe"
  if (value === "NO") return "No"
  return "Not answered"
}

function repeatClass(review: AdminReview) {
  const value = repeatValue(review)
  if (value === "YES") return "bg-emerald-500/10 text-emerald-300"
  if (value === "MAYBE") return "bg-amber-500/10 text-amber-300"
  if (value === "NO") return "bg-red-500/10 text-red-300"
  return "bg-muted text-muted-foreground"
}

function repeatOrder(review: AdminReview) {
  const value = repeatValue(review)
  if (value === "YES") return 3
  if (value === "MAYBE") return 2
  if (value === "NO") return 1
  return 0
}

function riskSignal(review: AdminReview) {
  if (review.isHidden) return "Hidden"
  if (review.replyHidden) return "Reply Hidden"
  if (repeatValue(review) === "NO") return "Would Not Repeat"
  if (repeatValue(review) === "MAYBE") return "Maybe Repeat"
  if (!review.comment?.trim()) return "No Comment"
  if (review.reply) return "Has Reply"
  return "Normal"
}

function signalClass(signal: string) {
  if (signal === "Hidden") return "bg-muted text-muted-foreground"
  if (signal === "Reply Hidden") return "bg-muted text-muted-foreground"
  if (signal === "Would Not Repeat") return "bg-red-500/10 text-red-300"
  if (signal === "Maybe Repeat") return "bg-amber-500/10 text-amber-300"
  if (signal === "No Comment") return "bg-amber-500/10 text-amber-300"
  if (signal === "Has Reply") return "bg-sky-500/10 text-sky-300"
  return "bg-emerald-500/10 text-emerald-300"
}

function StatCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  tone: "green" | "blue" | "amber" | "red" | "purple"
}) {
  const styles = {
    green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/15",
    blue: "bg-sky-500/10 text-sky-400 ring-sky-500/15",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/15",
    red: "bg-red-500/10 text-red-400 ring-red-500/15",
    purple: "bg-purple-500/10 text-purple-400 ring-purple-500/15",
  }

  return (
    <div className="flex min-h-[70px] items-center gap-3 rounded-lg border border-white/5 bg-card/70 px-3 py-2.5 shadow-sm shadow-black/10">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", styles[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold leading-tight">{value}</p>
          <p className="truncate text-sm font-medium leading-tight text-foreground/90">{title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "text-emerald-300"
      )}
      onClick={onClick}
    >
      {label}
      <ChevronsUpDown className="h-3.5 w-3.5" />
    </button>
  )
}

function UserCard({ label, user, tone }: { label: string; user: ReviewUser; tone: "blue" | "green" }) {
  return (
    <div className="rounded-lg border border-white/5 bg-background/35 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-white/10",
            tone === "blue" ? "bg-sky-500/15 text-sky-200" : "bg-emerald-500/15 text-emerald-200"
          )}
        >
          {initials(user)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName(user)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <Button className="mt-4 h-8 border-white/10 bg-background/60 text-xs" size="sm" variant="outline" disabled>
        View profile
      </Button>
    </div>
  )
}

export default function ReviewModerationPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("ALL")
  const [repeatFilter, setRepeatFilter] = useState<RepeatFilter>("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editing, setEditing] = useState<AdminReview | null>(null)
  const [editComment, setEditComment] = useState("")
  const [editReply, setEditReply] = useState("")
  const [hideReason, setHideReason] = useState("")

  const { data: reviews = [], isLoading, isError } = useQuery<AdminReview[]>({
    queryKey: ["admin-reviews"],
    queryFn: getReviews,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
      toast({ title: "Deleted", description: "Review has been removed." })
      setShowDetail(false)
      setSelectedId(null)
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete review.",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
      toast({ title: "Review updated" })
      setEditing(null)
      setHideReason("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update review.", variant: "destructive" })
    },
  })

  const filteredReviews = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...reviews]
      .filter((review) => {
        const haystack = `${review.comment || ""} ${review.reply || ""} ${displayName(review.author)} ${displayName(review.target)} ${review.service?.title || ""} ${review.booking?.id || ""}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesVisibility =
          visibilityFilter === "ALL" ||
          (visibilityFilter === "VISIBLE" && !review.isHidden) ||
          (visibilityFilter === "HIDDEN" && review.isHidden)
        const matchesRepeat =
          repeatFilter === "ALL" ||
          (repeatFilter === "YES" && repeatValue(review) === "YES") ||
          (repeatFilter === "MAYBE" && repeatValue(review) === "MAYBE") ||
          (repeatFilter === "NO" && repeatValue(review) === "NO") ||
          (repeatFilter === "HAS_REPLY" && Boolean(review.reply)) ||
          (repeatFilter === "NO_REPLY" && !review.reply)
        return matchesSearch && matchesVisibility && matchesRepeat
      })
      .sort((a, b) => {
        if (sortMode === "REPEAT_POSITIVE") return repeatOrder(b) - repeatOrder(a)
        if (sortMode === "REPEAT_NEGATIVE") return repeatOrder(a) - repeatOrder(b)
        if (sortMode === "REVIEWER_ASC") return displayName(a.author).localeCompare(displayName(b.author))
        if (sortMode === "REVIEWER_DESC") return displayName(b.author).localeCompare(displayName(a.author))
        if (sortMode === "TARGET_ASC") return displayName(a.target).localeCompare(displayName(b.target))
        if (sortMode === "TARGET_DESC") return displayName(b.target).localeCompare(displayName(a.target))
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sortMode === "OLDEST" ? diff : -diff
      })
  }, [repeatFilter, reviews, searchTerm, sortMode, visibilityFilter])

  const selectedReview = filteredReviews.find((review) => review.id === selectedId) ?? filteredReviews[0] ?? null
  const visibleCount = reviews.filter((review) => !review.isHidden).length
  const hiddenCount = reviews.filter((review) => review.isHidden).length
  const wouldRepeatCount = reviews.filter((review) => repeatValue(review) === "YES").length
  const wouldNotRepeatCount = reviews.filter((review) => repeatValue(review) === "NO").length
  const replyCount = reviews.filter((review) => review.reply).length
  const repeatAnsweredCount = reviews.filter((review) => repeatValue(review) !== "UNKNOWN").length
  const repeatRate = repeatAnsweredCount ? `${Math.round((wouldRepeatCount / repeatAnsweredCount) * 100)}%` : "0%"

  const openEdit = (review: AdminReview) => {
    setEditing(review)
    setEditComment(review.comment || "")
    setEditReply(review.reply || "")
    setHideReason(review.hiddenReason || "")
  }

  const openReview = (review: AdminReview) => {
    setSelectedId(review.id)
    setShowDetail(true)
  }

  const toggleHidden = (review: AdminReview, reason = "Hidden by admin review") => {
    updateMutation.mutate({
      id: review.id,
      data: {
        isHidden: !review.isHidden,
        hiddenReason: review.isHidden ? null : reason,
      },
    })
  }

  const toggleReplyHidden = (review: AdminReview, reason = "Hidden by admin review moderation") => {
    updateMutation.mutate({
      id: review.id,
      data: {
        replyHidden: !review.replyHidden,
        replyHiddenReason: review.replyHidden ? null : reason,
      },
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setVisibilityFilter("ALL")
    setRepeatFilter("ALL")
    setSortMode("NEWEST")
  }

  const cycleRatingSort = () => {
    setSortMode((current) => current === "REPEAT_POSITIVE" ? "REPEAT_NEGATIVE" : "REPEAT_POSITIVE")
  }

  const cycleDateSort = () => {
    setSortMode((current) => current === "NEWEST" ? "OLDEST" : "NEWEST")
  }

  const cycleReviewerSort = () => {
    setSortMode((current) => current === "REVIEWER_ASC" ? "REVIEWER_DESC" : "REVIEWER_ASC")
  }

  const cycleTargetSort = () => {
    setSortMode((current) => current === "TARGET_ASC" ? "TARGET_DESC" : "TARGET_ASC")
  }

  const cycleReplyFilter = () => {
    setRepeatFilter((current) => current === "HAS_REPLY" ? "NO_REPLY" : current === "NO_REPLY" ? "ALL" : "HAS_REPLY")
  }

  const editDialog = (
    <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Review Moderation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment</label>
            <Textarea className="border-white/10 bg-background/60" rows={4} value={editComment} onChange={(e) => setEditComment(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reply</label>
            <Textarea
              className="border-white/10 bg-background/60"
              rows={4}
              value={editReply}
              onChange={(e) => setEditReply(e.target.value)}
              placeholder="No reply yet"
            />
            <p className="text-xs text-muted-foreground">Leave empty to remove the reply text.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hidden Reason</label>
            <Input className="border-white/10 bg-background/60" value={hideReason} onChange={(e) => setHideReason(e.target.value)} placeholder="Reason shown internally" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="outline"
            onClick={() => editing && updateMutation.mutate({ id: editing.id, data: { isHidden: true, hiddenReason: hideReason || "Hidden by admin" } })}
          >
            Hide
          </Button>
          <Button
            onClick={() => editing && updateMutation.mutate({ id: editing.id, data: { comment: editComment, reply: editReply, hiddenReason: hideReason } })}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (showDetail && selectedReview) {
    const signal = riskSignal(selectedReview)

    return (
      <div className="min-h-screen bg-[#101211] p-6">
        <div className="mx-auto max-w-[1780px] space-y-4">
          <header className="flex flex-col gap-4 border-b border-white/5 pb-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                size="icon"
                variant="outline"
                className="mt-1 h-10 w-10 shrink-0 border-white/10 bg-card/70"
                onClick={() => setShowDetail(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight">Review Moderation</h1>
                  <Badge className={selectedReview.isHidden ? "bg-muted text-muted-foreground" : "bg-emerald-500/10 text-emerald-300"}>
                    {selectedReview.isHidden ? "Hidden" : "Visible"}
                  </Badge>
                  <Badge className={signalClass(signal)}>{signal}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{reviewType(selectedReview)} · {formatDate(selectedReview.createdAt)}</p>
              </div>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <UserCard label="Reviewer" user={selectedReview.author} tone="blue" />
                <UserCard label="Reviewed User" user={selectedReview.target} tone="green" />
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">Review</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 bg-background/60"
                      onClick={() => openEdit(selectedReview)}
                      title="Edit review"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 bg-background/60"
                      onClick={() => toggleHidden(selectedReview)}
                      disabled={updateMutation.isPending}
                      title={selectedReview.isHidden ? "Restore review" : "Hide review"}
                    >
                      {selectedReview.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm("Permanently delete this review?")) deleteMutation.mutate(selectedReview.id)
                      }}
                      disabled={deleteMutation.isPending}
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-white/5 bg-background/35 p-4 text-sm leading-6 text-muted-foreground">
                  {selectedReview.comment || "No comment provided."}
                </div>
                {selectedReview.isHidden && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                    Hidden reason: {selectedReview.hiddenReason || "No reason recorded"}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-semibold">
                    <MessageSquareReply className="h-4 w-4 text-muted-foreground" />
                    Reply
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 bg-background/60"
                      onClick={() => openEdit(selectedReview)}
                      title={selectedReview.reply ? "Edit reply" : "Add reply"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-white/10 bg-background/60"
                      onClick={() => toggleReplyHidden(selectedReview)}
                      disabled={!selectedReview.reply || updateMutation.isPending}
                      title={selectedReview.replyHidden ? "Restore reply" : "Hide reply"}
                    >
                      {selectedReview.replyHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm("Remove this reply text?")) updateMutation.mutate({ id: selectedReview.id, data: { reply: "" } })
                      }}
                      disabled={!selectedReview.reply || updateMutation.isPending}
                      title="Remove reply"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedReview.reply ? (
                  <div className="mt-4 rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">{selectedReview.reply}</p>
                    {selectedReview.repliedAt && <p className="mt-2 text-xs text-muted-foreground">Replied {formatDate(selectedReview.repliedAt)}</p>}
                    {selectedReview.replyUpdatedAt && <p className="mt-1 text-xs text-muted-foreground">Reply edited {formatDate(selectedReview.replyUpdatedAt)}</p>}
                    {selectedReview.replyHidden && (
                      <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                        Reply hidden: {selectedReview.replyHiddenReason || "No reason recorded"}
                        {selectedReview.replyHiddenAt && <span className="block text-xs text-amber-200/70">Hidden {formatDate(selectedReview.replyHiddenAt)}</span>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
                    No reply from the reviewed party.
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Moderation Summary</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Visibility</dt>
                    <dd>{selectedReview.isHidden ? "Hidden" : "Visible"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Would repeat</dt>
                    <dd><Badge className={repeatClass(selectedReview)}>{repeatLabel(selectedReview)}</Badge></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reply</dt>
                    <dd>{selectedReview.replyHidden ? "Hidden" : selectedReview.reply ? "Present" : "None"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Signal</dt>
                    <dd><Badge className={signalClass(signal)}>{signal}</Badge></dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="flex items-center gap-2 font-semibold">
                  <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                  Booking / Service Context
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-xs text-muted-foreground">Booking</p>
                    <p className="mt-1 font-mono text-sm">{selectedReview.booking?.id ? selectedReview.booking.id.slice(0, 12) : "Not returned"}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-xs text-muted-foreground">Service</p>
                    <p className="mt-1 text-sm font-semibold">{selectedReview.service?.title || "Not returned"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedReview.service?.category?.name || "No category"}</p>
                  </div>
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <BriefcaseBusiness className="mr-2 h-4 w-4" />
                    Open Booking
                  </Button>
                </div>
              </div>
            </aside>
          </section>
        </div>
        {editDialog}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1780px] space-y-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Review Moderation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Moderate reviews, replies, visibility, and marketplace trust signals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Reviews" value={reviews.length} description="All shown" icon={<MessageSquareReply className="h-4 w-4" />} tone="purple" />
          <StatCard title="Visible" value={visibleCount} description="Public reviews" icon={<Eye className="h-4 w-4" />} tone="green" />
          <StatCard title="Hidden" value={hiddenCount} description="Moderated out" icon={<EyeOff className="h-4 w-4" />} tone="amber" />
          <StatCard title="Would Not Repeat" value={wouldNotRepeatCount} description="No repeat signal" icon={<ShieldAlert className="h-4 w-4" />} tone="red" />
          <StatCard title="With Replies" value={replyCount} description="Has public reply" icon={<MessageSquareReply className="h-4 w-4" />} tone="blue" />
          <StatCard title="Would Repeat Rate" value={repeatRate} description="Yes among answered" icon={<CheckCircle className="h-4 w-4" />} tone="green" />
        </div>

        <div className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_170px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-white/10 bg-background/70 pl-9"
                placeholder="Search reviews, replies, users, booking..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={visibilityFilter} onValueChange={(value) => setVisibilityFilter(value as VisibilityFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Visibility</SelectItem>
                <SelectItem value="VISIBLE">Visible</SelectItem>
                <SelectItem value="HIDDEN">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={repeatFilter} onValueChange={(value) => setRepeatFilter(value as RepeatFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reviews</SelectItem>
                <SelectItem value="YES">Would repeat</SelectItem>
                <SelectItem value="MAYBE">Maybe repeat</SelectItem>
                <SelectItem value="NO">Would not repeat</SelectItem>
                <SelectItem value="HAS_REPLY">Has reply</SelectItem>
                <SelectItem value="NO_REPLY">No reply</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest</SelectItem>
                <SelectItem value="OLDEST">Oldest</SelectItem>
                <SelectItem value="REPEAT_POSITIVE">Would repeat first</SelectItem>
                <SelectItem value="REPEAT_NEGATIVE">Would not repeat first</SelectItem>
                <SelectItem value="REVIEWER_ASC">Reviewer A-Z</SelectItem>
                <SelectItem value="REVIEWER_DESC">Reviewer Z-A</SelectItem>
                <SelectItem value="TARGET_ASC">Reviewed A-Z</SelectItem>
                <SelectItem value="TARGET_DESC">Reviewed Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 border-white/10 bg-background/70" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/5 bg-card/70 p-2">
          {[
            ["ALL", "All", reviews.length],
            ["VISIBLE", "Visible", visibleCount],
            ["HIDDEN", "Hidden", hiddenCount],
          ].map(([value, label, count]) => (
            <button
              key={String(value)}
              className={cn(
                "rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                visibilityFilter === value && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              )}
              onClick={() => setVisibilityFilter(value as VisibilityFilter)}
            >
              {label}
              <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
            <p className="font-medium">Could not load reviews</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
            <p className="font-medium">No reviews found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking backend data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid min-w-[1080px] grid-cols-[.85fr_1.35fr_1fr_1fr_.85fr_.8fr_86px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div>
                <SortHeader
                  label="Would Repeat"
                  active={sortMode === "REPEAT_POSITIVE" || sortMode === "REPEAT_NEGATIVE"}
                  onClick={cycleRatingSort}
                />
              </div>
              <div>Review</div>
              <div>
                <SortHeader
                  label="Reviewer"
                  active={sortMode === "REVIEWER_ASC" || sortMode === "REVIEWER_DESC"}
                  onClick={cycleReviewerSort}
                />
              </div>
              <div>
                <SortHeader
                  label="Reviewed User"
                  active={sortMode === "TARGET_ASC" || sortMode === "TARGET_DESC"}
                  onClick={cycleTargetSort}
                />
              </div>
              <div>
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
                    (repeatFilter === "HAS_REPLY" || repeatFilter === "NO_REPLY") && "text-emerald-300"
                  )}
                  onClick={cycleReplyFilter}
                >
                  Reply
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div>
                <SortHeader
                  label="Date"
                  active={sortMode === "NEWEST" || sortMode === "OLDEST"}
                  onClick={cycleDateSort}
                />
              </div>
              <div className="text-right">Actions</div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[1080px]">
                {filteredReviews.map((review) => {
                  const signal = riskSignal(review)
                  return (
                    <div
                      key={review.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                    "grid w-full grid-cols-[.85fr_1.35fr_1fr_1fr_.85fr_.8fr_86px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40",
                        review.isHidden && "bg-muted/20 opacity-80"
                      )}
                      onClick={() => openReview(review)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          openReview(review)
                        }
                      }}
                    >
                      <div>
                        <Badge className={repeatClass(review)}>{repeatLabel(review)}</Badge>
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm italic text-muted-foreground">"{review.comment || "No comment"}"</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge className={signalClass(signal)}>{signal}</Badge>
                          {review.editedByAdminAt && <Badge className="bg-purple-500/10 text-purple-300">Edited</Badge>}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName(review.author)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Reviewer</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName(review.target)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Reviewed user</p>
                      </div>
                      <div>
                        <Badge className={review.reply ? "bg-sky-500/10 text-sky-300" : "bg-muted text-muted-foreground"}>
                          {review.reply ? "Has reply" : "No reply"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{relativeTime(review.createdAt)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <Button className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700" size="sm" onClick={() => openReview(review)}>
                          Open
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 to {filteredReviews.length} of {reviews.length} reviews</span>
              <span>50 / page</span>
            </div>
          </div>
        )}
      </div>
      {editDialog}
    </div>
  )
}
