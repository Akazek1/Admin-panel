"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  History,
  Loader2,
  MapPin,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react"
import { Booking, getBookings, overrideBooking, updateBookingStatus } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type ScheduleFilter = "ALL" | "SET" | "MISSING"
type LocationFilter = "ALL" | "SET" | "MISSING"
type ServiceFilter = "ALL" | "HIGH_VALUE" | "READY" | "NEEDS_ATTENTION"
type SortMode = "RECENT" | "PRICE_HIGH" | "PRICE_LOW" | "MISSING_FIRST"

const currencyFormatter = new Intl.NumberFormat("en-US")

function fullName(user?: { firstName: string | null; lastName: string | null; phoneNumber?: string | null }) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phoneNumber || "Unknown"
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function bookingTitle(booking: Booking) {
  return booking.service?.title || booking.job?.title || "Custom Service"
}

function bookingCode(booking: Booking, index = 0) {
  const suffix = booking.id ? booking.id.slice(0, 8).toUpperCase() : String(index + 1).padStart(4, "0")
  return `BK-${suffix}`
}

function formatMoney(value?: number | null) {
  return `${currencyFormatter.format(Number(value) || 0)} RWF`
}

function relativeDate(value?: string | null) {
  if (!value) return "-"
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "-"
  const diff = Date.now() - time
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function locationText(booking: Booking) {
  const parts = [booking.address?.sector, booking.address?.district, booking.address?.city].filter(Boolean)
  return parts.length ? parts.join(", ") : "Not provided"
}

function hasLocation(booking: Booking) {
  return Boolean(booking.address?.city || booking.address?.district || booking.address?.sector)
}

function isHighValue(booking: Booking) {
  return (Number(booking.agreedPrice) || 0) >= 50000
}

function hasSchedule(booking: Booking) {
  return Boolean(booking.scheduledFor)
}

function providerVerified(booking: Booking) {
  return booking.worker?.isVerified !== false
}

function priceWithinRange(booking: Booking) {
  const price = Number(booking.agreedPrice) || 0
  const min = Number(booking.service?.priceMin) || 0
  return !min || price >= Math.max(0, min * 0.5)
}

function riskTags(booking: Booking) {
  const tags: Array<{ label: string; tone: "green" | "amber" | "purple" | "red" }> = []
  if (!hasSchedule(booking)) tags.push({ label: "Missing schedule", tone: "amber" })
  if (!hasLocation(booking)) tags.push({ label: "Missing location", tone: "amber" })
  if (isHighValue(booking)) tags.push({ label: "High value", tone: "purple" })
  if (!providerVerified(booking)) tags.push({ label: "Provider unverified", tone: "red" })
  if (tags.length === 0) tags.push({ label: "Ready", tone: "green" })
  return tags
}

function chipClass(tone: "green" | "amber" | "purple" | "red" | "blue") {
  const styles = {
    green: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
    purple: "bg-purple-500/10 text-purple-300",
    red: "bg-red-500/10 text-red-300",
    blue: "bg-sky-500/10 text-sky-300",
  }
  return styles[tone]
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
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
        <Icon className="h-4 w-4" />
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

function PersonBlock({
  label,
  name,
  phone,
  email,
  tone,
}: {
  label: string
  name: string
  phone?: string | null
  email?: string | null
  tone: "purple" | "blue"
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">{label}</p>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-white/10",
            tone === "purple" ? "bg-purple-500/15 text-purple-200" : "bg-sky-500/15 text-sky-200"
          )}
        >
          {initials(name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{name}</p>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{phone || "No phone"}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{email || "No email"}</p>
        </div>
      </div>
      <Button className="mt-3 h-8 border-white/10 bg-background/60 text-xs" size="sm" variant="outline" disabled>
        View profile
      </Button>
    </div>
  )
}

function ChecklistItem({ ok, title, description }: { ok: boolean; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", ok ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300")}>
        {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className={cn("text-xs", ok ? "text-emerald-300" : "text-red-300")}>{description}</p>
      </div>
    </div>
  )
}

export default function PendingBookingsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("ALL")
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("ALL")
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<Booking | null>(null)
  const [overrideStatus, setOverrideStatus] = useState("CONFIRMED")
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideNote, setOverrideNote] = useState("")
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})

  const { data: bookings, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-bookings-pending"],
    queryFn: () => getBookings("PENDING"),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-pending"] })
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
      toast({ title: "Booking updated", description: "The booking status changed successfully." })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update booking.",
        variant: "destructive",
      })
    },
  })

  const overrideMutation = useMutation({
    mutationFn: () =>
      overrideBooking(overrideTarget!.id, {
        status: overrideStatus,
        reason: overrideReason,
        note: overrideNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-pending"] })
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] })
      toast({ title: "Booking override applied" })
      setOverrideTarget(null)
      setOverrideReason("")
      setOverrideNote("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Override failed.", variant: "destructive" })
    },
  })

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...(bookings ?? [])]
      .filter((booking) => {
        const haystack = `${bookingTitle(booking)} ${booking.id} ${fullName(booking.employer)} ${booking.employer.phoneNumber || ""} ${fullName(booking.worker)} ${booking.worker.phoneNumber || ""}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesSchedule =
          scheduleFilter === "ALL" || (scheduleFilter === "SET" && hasSchedule(booking)) || (scheduleFilter === "MISSING" && !hasSchedule(booking))
        const matchesLocation =
          locationFilter === "ALL" || (locationFilter === "SET" && hasLocation(booking)) || (locationFilter === "MISSING" && !hasLocation(booking))
        const needsAttention = !hasSchedule(booking) || !hasLocation(booking) || !providerVerified(booking)
        const ready = !needsAttention
        const matchesService =
          serviceFilter === "ALL" ||
          (serviceFilter === "HIGH_VALUE" && isHighValue(booking)) ||
          (serviceFilter === "READY" && ready) ||
          (serviceFilter === "NEEDS_ATTENTION" && needsAttention)
        return matchesSearch && matchesSchedule && matchesLocation && matchesService
      })
      .sort((a, b) => {
        if (sortMode === "PRICE_HIGH") return (Number(b.agreedPrice) || 0) - (Number(a.agreedPrice) || 0)
        if (sortMode === "PRICE_LOW") return (Number(a.agreedPrice) || 0) - (Number(b.agreedPrice) || 0)
        if (sortMode === "MISSING_FIRST") return riskTags(b).length - riskTags(a).length
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [bookings, locationFilter, scheduleFilter, searchTerm, serviceFilter, sortMode])

  useEffect(() => {
    if (!filteredBookings.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredBookings.some((booking) => booking.id === selectedId)) {
      setSelectedId(filteredBookings[0].id)
    }
  }, [filteredBookings, selectedId])

  const selectedBooking = filteredBookings.find((booking) => booking.id === selectedId) ?? filteredBookings[0] ?? null
  const allVisibleSelected = filteredBookings.length > 0 && filteredBookings.every((booking) => selectedIds.includes(booking.id))

  const stats = useMemo(() => {
    const all = bookings ?? []
    return {
      total: all.length,
      missingSchedule: all.filter((booking) => !hasSchedule(booking)).length,
      missingLocation: all.filter((booking) => !hasLocation(booking)).length,
      highValue: all.filter(isHighValue).length,
      newToday: all.filter((booking) => Date.now() - new Date(booking.createdAt).getTime() < 24 * 60 * 60 * 1000).length,
      needsOverride: all.filter((booking) => !hasSchedule(booking) || !hasLocation(booking) || !providerVerified(booking)).length,
    }
  }, [bookings])

  const toggleVisible = (checked: boolean) => {
    const ids = filteredBookings.map((booking) => booking.id)
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id))))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setScheduleFilter("ALL")
    setLocationFilter("ALL")
    setServiceFilter("ALL")
    setSortMode("RECENT")
  }

  const changeStatus = (booking: Booking, status: "CONFIRMED" | "CANCELLED") => {
    const action = status === "CONFIRMED" ? "confirm" : "cancel"
    const ok = window.confirm(`Are you sure you want to ${action} this booking?`)
    if (!ok) return
    statusMutation.mutate({ id: booking.id, status })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101211]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const overrideDialog = (
    <Dialog open={!!overrideTarget} onOpenChange={(open) => !open && setOverrideTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Booking Override</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Use this when a booking is stuck or support has confirmed the correct status with both parties.
          </p>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={overrideStatus} onValueChange={setOverrideStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="e.g. Employer confirmed by phone" />
          </div>
          <div className="space-y-2">
            <Label>Internal Note</Label>
            <Textarea value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
          <Button disabled={!overrideReason.trim() || overrideMutation.isPending} onClick={() => overrideMutation.mutate()}>
            {overrideMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Apply Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (showDetail && selectedBooking) {
    return (
      <div className="min-h-screen bg-[#101211] p-6">
        <div className="mx-auto max-w-[1780px] space-y-4">
          <header className="flex flex-col gap-4 border-b border-white/5 pb-4 xl:flex-row xl:items-center xl:justify-between">
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
                  <h1 className="line-clamp-2 text-3xl font-semibold tracking-tight">{bookingTitle(selectedBooking)}</h1>
                  <Badge className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">PENDING</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Booking ID: {bookingCode(selectedBooking)}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted {relativeDate(selectedBooking.createdAt)} ({formatDate(selectedBooking.createdAt)})
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => setShowDetail(false)}>
                Back to Queue
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={statusMutation.isPending}
                onClick={() => changeStatus(selectedBooking, "CONFIRMED")}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Booking
              </Button>
            </div>
          </header>

          <section className="rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5 border-b border-white/5 p-5 xl:border-b-0 xl:border-r">
                <div className="grid gap-4 lg:grid-cols-2">
                  <PersonBlock
                    label="Employer"
                    name={fullName(selectedBooking.employer)}
                    phone={selectedBooking.employer.phoneNumber}
                    email={selectedBooking.employer.email}
                    tone="purple"
                  />
                  <PersonBlock
                    label="Provider"
                    name={fullName(selectedBooking.worker)}
                    phone={selectedBooking.worker.phoneNumber}
                    email={selectedBooking.worker.email}
                    tone="blue"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="mt-2 font-semibold">{bookingTitle(selectedBooking)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedBooking.service ? "Marketplace service" : "Custom booking"}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="mt-2 font-semibold">{hasLocation(selectedBooking) ? "Location set" : "Missing location"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{locationText(selectedBooking)}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Schedule</p>
                    <p className="mt-2 font-semibold">{selectedBooking.scheduledFor ? formatDate(selectedBooking.scheduledFor) : "Not set"}</p>
                    {!selectedBooking.scheduledFor ? <p className="mt-1 text-sm text-muted-foreground">Employer has not provided date/time</p> : null}
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Agreed Price</p>
                    <p className="mt-2 text-2xl font-semibold">{formatMoney(selectedBooking.agreedPrice)}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-white/5 bg-background/35 p-4">
                  <p className="font-semibold">Notes</p>
                  <Label className="text-xs text-muted-foreground">Admin note (visible to admins only)</Label>
                  <Textarea
                    className="min-h-[120px] border-white/10 bg-background/70"
                    maxLength={500}
                    placeholder="Add internal note..."
                    value={adminNotes[selectedBooking.id] ?? ""}
                    onChange={(event) => setAdminNotes((prev) => ({ ...prev, [selectedBooking.id]: event.target.value }))}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{(adminNotes[selectedBooking.id] ?? "").length} / 500</span>
                    <Button
                      className="h-8 border-white/10 bg-background/60 text-xs"
                      variant="outline"
                      onClick={() => toast({ title: "Note saved locally", description: "Backend note storage can be wired later." })}
                      disabled={!(adminNotes[selectedBooking.id] ?? "").trim()}
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              </div>

              <aside className="space-y-4 p-5">
                <div className="space-y-4 rounded-lg border border-white/5 bg-background/35 p-4">
                  <p className="font-semibold">Risk Checklist</p>
                  <ChecklistItem ok={hasSchedule(selectedBooking)} title="Schedule provided" description={hasSchedule(selectedBooking) ? "Provided" : "Missing"} />
                  <ChecklistItem ok={hasLocation(selectedBooking)} title="Location provided" description={hasLocation(selectedBooking) ? "Provided" : "Missing"} />
                  <ChecklistItem ok={providerVerified(selectedBooking)} title="Provider verified" description={providerVerified(selectedBooking) ? "Verified" : "Needs review"} />
                  <ChecklistItem ok={priceWithinRange(selectedBooking)} title="Price within range" description={priceWithinRange(selectedBooking) ? "Within range" : "Needs review"} />
                </div>

                <div className="space-y-3 rounded-lg border border-white/5 bg-background/35 p-4">
                  <p className="font-semibold">Summary</p>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Service type</span>
                      <span>{selectedBooking.service ? "Service" : "Custom"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">High value</span>
                      <span className={isHighValue(selectedBooking) ? "text-amber-300" : "text-emerald-300"}>{isHighValue(selectedBooking) ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Risk flags</span>
                      <span>{riskTags(selectedBooking).filter((tag) => tag.label !== "Ready").length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Messages</span>
                      <span>Not synced</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="h-10 w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={statusMutation.isPending}
                    onClick={() => changeStatus(selectedBooking, "CONFIRMED")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </Button>
                  <Button
                    className="h-10 w-full border-red-500/50 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    disabled={statusMutation.isPending}
                    variant="outline"
                    onClick={() => changeStatus(selectedBooking, "CANCELLED")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </Button>
                  <Button
                    className="h-10 w-full border-white/10 bg-background/60"
                    variant="outline"
                    onClick={() => {
                      setOverrideTarget(selectedBooking)
                      setOverrideStatus("CONFIRMED")
                    }}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Override Status
                  </Button>
                  <Button className="h-10 w-full text-sky-300" variant="ghost" disabled>
                    <History className="mr-2 h-4 w-4" />
                    View full history
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
              </aside>
            </div>
          </section>
        </div>
        {overrideDialog}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1780px] space-y-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Pending Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review booking requests, confirm valid matches, cancel invalid requests, and resolve stuck submissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="border-white/10 bg-card/70"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Pending Bookings" value={stats.total} description="Needs review" icon={Clock3} tone="amber" />
          <StatCard title="Missing Schedule" value={stats.missingSchedule} description="No date/time set" icon={Calendar} tone="amber" />
          <StatCard title="Missing Location" value={stats.missingLocation} description="No address provided" icon={MapPin} tone="red" />
          <StatCard title="High Value Requests" value={stats.highValue} description="Above 50,000 RWF" icon={Banknote} tone="purple" />
          <StatCard title="New Today" value={stats.newToday} description="Submitted in 24 hours" icon={Clock3} tone="blue" />
          <StatCard title="Needs Override" value={stats.needsOverride} description="Admin attention" icon={AlertTriangle} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="min-w-0 space-y-3">
            <div className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_150px_170px_120px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 border-white/10 bg-background/70 pl-9"
                    placeholder="Search by booking, employer, provider, phone, or ID..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Select value={serviceFilter} onValueChange={(value) => setServiceFilter(value as ServiceFilter)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70">
                    <SelectValue placeholder="Service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Services</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="NEEDS_ATTENTION">Needs attention</SelectItem>
                    <SelectItem value="HIGH_VALUE">High value</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={scheduleFilter} onValueChange={(value) => setScheduleFilter(value as ScheduleFilter)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70">
                    <SelectValue placeholder="Schedule status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All schedules</SelectItem>
                    <SelectItem value="SET">Schedule set</SelectItem>
                    <SelectItem value="MISSING">Missing schedule</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={(value) => setLocationFilter(value as LocationFilter)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70">
                    <SelectValue placeholder="Location status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All locations</SelectItem>
                    <SelectItem value="SET">Location set</SelectItem>
                    <SelectItem value="MISSING">Missing location</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECENT">Recently submitted</SelectItem>
                    <SelectItem value="MISSING_FIRST">Missing info first</SelectItem>
                    <SelectItem value="PRICE_HIGH">Price high to low</SelectItem>
                    <SelectItem value="PRICE_LOW">Price low to high</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="h-9 border-white/10 bg-background/70" variant="outline" onClick={clearFilters}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>

            {isError ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-300" />
                <p className="font-medium">Could not load pending bookings</p>
                <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
                <Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No pending bookings found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking the backend data.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
                <div className="grid min-w-[1100px] grid-cols-[44px_1.4fr_1fr_1fr_1fr_1fr_.7fr_.9fr_116px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <div>
                    <Checkbox checked={allVisibleSelected} onCheckedChange={(value) => toggleVisible(!!value)} aria-label="Select visible bookings" />
                  </div>
                  <div className="flex items-center gap-1 text-left">Booking <ChevronRight className="h-3 w-3 rotate-90" /></div>
                  <div>Employer</div>
                  <div>Provider</div>
                  <div>Location</div>
                  <div>Scheduled</div>
                  <div>Price</div>
                  <div className="flex items-center gap-1 text-left">Submitted <ChevronRight className="h-3 w-3 rotate-90" /></div>
                  <div className="text-right">Actions</div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[1100px]">
                    {filteredBookings.map((booking, index) => {
                      const title = bookingTitle(booking)
                      const employer = fullName(booking.employer)
                      const worker = fullName(booking.worker)
                      return (
                        <div
                          key={booking.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "grid w-full grid-cols-[44px_1.4fr_1fr_1fr_1fr_1fr_.7fr_.9fr_116px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
                          )}
                          onClick={() => {
                            setSelectedId(booking.id)
                            setShowDetail(true)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              setSelectedId(booking.id)
                              setShowDetail(true)
                            }
                          }}
                        >
                          <div onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(booking.id)}
                              onCheckedChange={(value) =>
                                setSelectedIds((prev) =>
                                  value ? Array.from(new Set([...prev, booking.id])) : prev.filter((id) => id !== booking.id)
                                )
                              }
                              aria-label={`Select booking ${booking.id}`}
                            />
                          </div>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-200 ring-1 ring-white/10">
                              <UserRound className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold">{title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{bookingCode(booking, index)}</p>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{employer}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{booking.employer.phoneNumber || "No phone"}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{worker}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{booking.worker.phoneNumber || "No phone"}</p>
                          </div>
                          <div className="min-w-0">
                            <p className={cn("truncate text-sm font-medium", hasLocation(booking) ? "text-foreground" : "text-amber-300")}>
                              {hasLocation(booking) ? "Set" : "Missing"}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{locationText(booking)}</p>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <p className="truncate text-sm">{booking.scheduledFor ? formatDate(booking.scheduledFor) : "Not set"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{currencyFormatter.format(Number(booking.agreedPrice) || 0)}</p>
                            <p className="text-xs text-muted-foreground">RWF</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{relativeDate(booking.createdAt)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{formatDate(booking.createdAt)}</p>
                          </div>
                          <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                            <Button
                              className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
                              size="sm"
                              onClick={() => {
                                setSelectedId(booking.id)
                                setShowDetail(true)
                              }}
                            >
                              Review
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button className="h-8 w-8 border-white/10 bg-background/60 p-0" size="icon" variant="outline">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => changeStatus(booking, "CONFIRMED")}>Confirm booking</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-400" onClick={() => changeStatus(booking, "CANCELLED")}>Cancel booking</DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setOverrideTarget(booking)
                                    setOverrideStatus("CONFIRMED")
                                  }}
                                >
                                  Override status
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing 1 to {filteredBookings.length} of {bookings?.length ?? 0} bookings
                  </span>
                  <div className="flex items-center gap-2">
                    <Button className="h-8 w-8 border-white/10 bg-background/60 p-0" variant="outline" disabled>
                      1
                    </Button>
                    <Button className="h-8 border-white/10 bg-background/60 px-3" variant="outline" disabled>
                      10 / page
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="hidden min-h-[520px] rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10 min-[1900px]:min-h-[720px] min-[1900px]:sticky min-[1900px]:top-5 min-[1900px]:self-start">
            {selectedBooking ? (
              <div>
                <div className="border-b border-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="line-clamp-2 text-lg font-semibold">{bookingTitle(selectedBooking)}</h2>
                        <Badge className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/10">PENDING</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Booking ID: {bookingCode(selectedBooking)}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {relativeDate(selectedBooking.createdAt)} ({formatDate(selectedBooking.createdAt)})
                      </p>
                    </div>
                    <Button className="h-8 w-8 shrink-0 border-white/10 bg-background/60 p-0" variant="outline" onClick={() => setSelectedId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1fr_260px] min-[1900px]:grid-cols-1 min-[2200px]:grid-cols-[1fr_190px]">
                  <div className="space-y-4 border-b border-white/5 p-4 lg:border-b-0 lg:border-r min-[1900px]:border-b min-[1900px]:border-r-0 min-[2200px]:border-b-0 min-[2200px]:border-r">
                    <PersonBlock
                      label="Employer"
                      name={fullName(selectedBooking.employer)}
                      phone={selectedBooking.employer.phoneNumber}
                      email={selectedBooking.employer.email}
                      tone="purple"
                    />
                    <PersonBlock
                      label="Provider"
                      name={fullName(selectedBooking.worker)}
                      phone={selectedBooking.worker.phoneNumber}
                      email={selectedBooking.worker.email}
                      tone="blue"
                    />

                    <div className="space-y-3 rounded-lg border border-white/5 bg-background/35 p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
                          <UsersRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{bookingTitle(selectedBooking)}</p>
                          <p className="text-xs text-muted-foreground">{selectedBooking.service ? "Marketplace service" : "Custom booking"}</p>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Location</p>
                        <div className="mt-1 flex items-start gap-2">
                          <MapPin className={cn("mt-0.5 h-4 w-4", hasLocation(selectedBooking) ? "text-emerald-300" : "text-amber-300")} />
                          <div>
                            <p className="text-sm">{hasLocation(selectedBooking) ? "Location set" : "Missing location"}</p>
                            <p className="text-xs text-muted-foreground">{locationText(selectedBooking)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Schedule</p>
                        <div className="mt-1 flex items-start gap-2">
                          <Calendar className={cn("mt-0.5 h-4 w-4", hasSchedule(selectedBooking) ? "text-emerald-300" : "text-amber-300")} />
                          <div>
                            <p className="text-sm">{selectedBooking.scheduledFor ? formatDate(selectedBooking.scheduledFor) : "Not set"}</p>
                            {!selectedBooking.scheduledFor ? <p className="text-xs text-muted-foreground">Employer has not provided date/time</p> : null}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Agreed Price</p>
                        <p className="mt-1 text-lg font-semibold">{formatMoney(selectedBooking.agreedPrice)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-sm font-semibold">Notes</p>
                      <Label className="text-xs text-muted-foreground">Admin note (visible to admins only)</Label>
                      <Textarea
                        className="min-h-[92px] border-white/10 bg-background/70"
                        maxLength={500}
                        placeholder="Add internal note..."
                        value={adminNotes[selectedBooking.id] ?? ""}
                        onChange={(event) => setAdminNotes((prev) => ({ ...prev, [selectedBooking.id]: event.target.value }))}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{(adminNotes[selectedBooking.id] ?? "").length} / 500</span>
                        <Button
                          className="h-8 border-white/10 bg-background/60 text-xs"
                          variant="outline"
                          onClick={() => toast({ title: "Note saved locally", description: "Backend note storage can be wired later." })}
                          disabled={!(adminNotes[selectedBooking.id] ?? "").trim()}
                        >
                          Save note
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="space-y-4 rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-sm font-semibold">Risk Checklist</p>
                      <ChecklistItem ok={hasSchedule(selectedBooking)} title="Schedule provided" description={hasSchedule(selectedBooking) ? "Provided" : "Missing"} />
                      <ChecklistItem ok={hasLocation(selectedBooking)} title="Location provided" description={hasLocation(selectedBooking) ? "Provided" : "Missing"} />
                      <ChecklistItem ok={providerVerified(selectedBooking)} title="Provider verified" description={providerVerified(selectedBooking) ? "Verified" : "Needs review"} />
                      <ChecklistItem ok={priceWithinRange(selectedBooking)} title="Price within range" description={priceWithinRange(selectedBooking) ? "Within range" : "Needs review"} />
                    </div>

                    <div className="space-y-3 rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-sm font-semibold">Summary</p>
                      <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Service type</span>
                          <span>{selectedBooking.service ? "Service" : "Custom"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">High value</span>
                          <span className={isHighValue(selectedBooking) ? "text-amber-300" : "text-emerald-300"}>{isHighValue(selectedBooking) ? "Yes" : "No"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Risk flags</span>
                          <span>{riskTags(selectedBooking).filter((tag) => tag.label !== "Ready").length}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Messages</span>
                          <span>Not synced</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="h-10 w-full bg-emerald-600 hover:bg-emerald-700"
                        disabled={statusMutation.isPending}
                        onClick={() => changeStatus(selectedBooking, "CONFIRMED")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Confirm Booking
                      </Button>
                      <Button
                        className="h-10 w-full border-red-500/50 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        disabled={statusMutation.isPending}
                        variant="outline"
                        onClick={() => changeStatus(selectedBooking, "CANCELLED")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </Button>
                      <Button
                        className="h-10 w-full border-white/10 bg-background/60"
                        variant="outline"
                        onClick={() => {
                          setOverrideTarget(selectedBooking)
                          setOverrideStatus("CONFIRMED")
                        }}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Override Status
                      </Button>
                      <Button className="h-10 w-full text-sky-300" variant="ghost" disabled>
                        <History className="mr-2 h-4 w-4" />
                        View full history
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center p-8 text-center">
                <div>
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Select a booking</p>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a row to review booking details.</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {overrideDialog}
    </div>
  )
}
