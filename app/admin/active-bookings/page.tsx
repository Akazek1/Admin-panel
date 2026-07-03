"use client"

import React, { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Clock3,
  Filter,
  Flag,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react"
import type { Booking } from "@/lib/api"
import { getBookings, overrideBooking, updateBookingStatus } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type StatusFilter = "ALL" | "CONFIRMED" | "IN_PROGRESS" | "NEEDS_ATTENTION" | "OVERDUE"
type LocationFilter = "ALL" | "SET" | "MISSING"
type ServiceFilter = "ALL" | "HIGH_VALUE" | "REPORTED"
type SortMode = "RECENT" | "PRICE_HIGH" | "PRICE_LOW" | "STATUS"

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
  return booking.service?.category?.name || booking.job?.title || "Custom Service"
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

function hasSchedule(booking: Booking) {
  return Boolean(booking.scheduledFor)
}

function isHighValue(booking: Booking) {
  return (Number(booking.agreedPrice) || 0) >= 50000
}

function isOverdue(booking: Booking) {
  if (booking.status !== "IN_PROGRESS" || !booking.scheduledFor) return false
  return Date.now() - new Date(booking.scheduledFor).getTime() > 24 * 60 * 60 * 1000
}

function startsToday(booking: Booking) {
  if (!booking.scheduledFor) return false
  const scheduled = new Date(booking.scheduledFor)
  const now = new Date()
  return scheduled.toDateString() === now.toDateString()
}

function reportedSignal(booking: Booking) {
  return booking.notes?.toLowerCase().includes("report") || booking.notes?.toLowerCase().includes("issue") || false
}

function statusBadgeClass(status: Booking["status"]) {
  if (status === "IN_PROGRESS") return "bg-sky-500/10 text-sky-300"
  if (status === "CONFIRMED") return "bg-amber-500/10 text-amber-300"
  return "bg-muted text-muted-foreground"
}

function displayStatus(status: Booking["status"]) {
  return status.replace("_", " ")
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
          <p className="truncate text-sm font-semibold">{name}</p>
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

export default function ActiveBookingsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("ALL")
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<Booking | null>(null)
  const [overrideStatus, setOverrideStatus] = useState("IN_PROGRESS")
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideNote, setOverrideNote] = useState("")

  const confirmedQuery = useQuery<Booking[]>({
    queryKey: ["admin-bookings", "CONFIRMED"],
    queryFn: () => getBookings("CONFIRMED"),
  })

  const inProgressQuery = useQuery<Booking[]>({
    queryKey: ["admin-bookings", "IN_PROGRESS"],
    queryFn: () => getBookings("IN_PROGRESS"),
  })

  const bookings = useMemo(
    () => [...(confirmedQuery.data ?? []), ...(inProgressQuery.data ?? [])],
    [confirmedQuery.data, inProgressQuery.data]
  )

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBookingStatus(id, status),
    onSuccess: () => {
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
    return [...bookings]
      .filter((booking) => {
        const haystack = `${bookingTitle(booking)} ${booking.id} ${fullName(booking.employer)} ${booking.employer.phoneNumber || ""} ${fullName(booking.worker)} ${booking.worker.phoneNumber || ""} ${booking.status}`.toLowerCase()
        const needsAttention = !hasLocation(booking) || !hasSchedule(booking) || reportedSignal(booking) || isOverdue(booking)
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesStatus =
          statusFilter === "ALL" ||
          booking.status === statusFilter ||
          (statusFilter === "NEEDS_ATTENTION" && needsAttention) ||
          (statusFilter === "OVERDUE" && isOverdue(booking))
        const matchesLocation =
          locationFilter === "ALL" || (locationFilter === "SET" && hasLocation(booking)) || (locationFilter === "MISSING" && !hasLocation(booking))
        const matchesService =
          serviceFilter === "ALL" ||
          (serviceFilter === "HIGH_VALUE" && isHighValue(booking)) ||
          (serviceFilter === "REPORTED" && reportedSignal(booking))
        return matchesSearch && matchesStatus && matchesLocation && matchesService
      })
      .sort((a, b) => {
        if (sortMode === "PRICE_HIGH") return (Number(b.agreedPrice) || 0) - (Number(a.agreedPrice) || 0)
        if (sortMode === "PRICE_LOW") return (Number(a.agreedPrice) || 0) - (Number(b.agreedPrice) || 0)
        if (sortMode === "STATUS") return a.status.localeCompare(b.status)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [bookings, locationFilter, searchTerm, serviceFilter, sortMode, statusFilter])

  const selectedBooking = filteredBookings.find((booking) => booking.id === selectedId) ?? filteredBookings[0] ?? null
  const isLoading = confirmedQuery.isLoading || inProgressQuery.isLoading
  const isError = confirmedQuery.isError || inProgressQuery.isError

  const confirmedCount = bookings.filter((booking) => booking.status === "CONFIRMED").length
  const inProgressCount = bookings.filter((booking) => booking.status === "IN_PROGRESS").length
  const todayCount = bookings.filter(startsToday).length
  const overdueCount = bookings.filter(isOverdue).length
  const reportedCount = bookings.filter(reportedSignal).length
  const needsAttentionCount = bookings.filter((booking) => !hasLocation(booking) || !hasSchedule(booking) || reportedSignal(booking) || isOverdue(booking)).length

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
    setLocationFilter("ALL")
    setServiceFilter("ALL")
    setSortMode("RECENT")
  }

  const changeStatus = (booking: Booking, status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED") => {
    const ok = window.confirm(`Are you sure you want to mark this booking as ${displayStatus(status).toLowerCase()}?`)
    if (!ok) return
    statusMutation.mutate({ id: booking.id, status })
  }

  const refetchAll = () => {
    confirmedQuery.refetch()
    inProgressQuery.refetch()
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
            <Input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="e.g. Provider confirmed by phone" />
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
                  <Badge className={statusBadgeClass(selectedBooking.status)}>{displayStatus(selectedBooking.status)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Booking ID: {bookingCode(selectedBooking)}</p>
                <p className="text-sm text-muted-foreground">Last update {relativeDate(selectedBooking.createdAt)} ({formatDate(selectedBooking.createdAt)})</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => setShowDetail(false)}>
                Back to Active
              </Button>
              {selectedBooking.status === "CONFIRMED" ? (
                <Button className="bg-sky-600 hover:bg-sky-700" disabled={statusMutation.isPending} onClick={() => changeStatus(selectedBooking, "IN_PROGRESS")}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Booking
                </Button>
              ) : (
                <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={statusMutation.isPending} onClick={() => changeStatus(selectedBooking, "COMPLETED")}>
                  <Check className="mr-2 h-4 w-4" />
                  Complete Booking
                </Button>
              )}
            </div>
          </header>

          <section className="rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5 border-b border-white/5 p-5 xl:border-b-0 xl:border-r">
                <div className="grid gap-4 lg:grid-cols-2">
                  <PersonBlock label="Employer" name={fullName(selectedBooking.employer)} phone={selectedBooking.employer.phoneNumber} email={selectedBooking.employer.email} tone="purple" />
                  <PersonBlock label="Provider" name={fullName(selectedBooking.worker)} phone={selectedBooking.worker.phoneNumber} email={selectedBooking.worker.email} tone="blue" />
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="mt-2 font-semibold">{bookingTitle(selectedBooking)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedBooking.service ? "Marketplace service" : "Custom booking"}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="mt-2 font-semibold">{hasLocation(selectedBooking) ? "Set" : "Missing"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{locationText(selectedBooking)}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Schedule</p>
                    <p className="mt-2 font-semibold">{selectedBooking.scheduledFor ? formatDate(selectedBooking.scheduledFor) : "Not set"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedBooking.status === "CONFIRMED" ? "Awaiting start" : "Currently underway"}</p>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="mt-2 text-2xl font-semibold">{formatMoney(selectedBooking.agreedPrice)}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-background/35 p-4">
                  <p className="font-semibold">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selectedBooking.notes || "No booking notes returned."}</p>
                </div>
              </div>

              <aside className="space-y-4 p-5">
                <div className="space-y-3 rounded-lg border border-white/5 bg-background/35 p-4">
                  <p className="font-semibold">Operational Snapshot</p>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={statusBadgeClass(selectedBooking.status)}>{displayStatus(selectedBooking.status)}</Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Overdue</span>
                      <span className={isOverdue(selectedBooking) ? "text-red-300" : "text-emerald-300"}>{isOverdue(selectedBooking) ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Reported</span>
                      <span className={reportedSignal(selectedBooking) ? "text-red-300" : "text-emerald-300"}>{reportedSignal(selectedBooking) ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">High value</span>
                      <span className={isHighValue(selectedBooking) ? "text-amber-300" : "text-emerald-300"}>{isHighValue(selectedBooking) ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedBooking.status === "CONFIRMED" ? (
                    <Button className="h-10 w-full bg-sky-600 hover:bg-sky-700" disabled={statusMutation.isPending} onClick={() => changeStatus(selectedBooking, "IN_PROGRESS")}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Start Booking
                    </Button>
                  ) : (
                    <Button className="h-10 w-full bg-emerald-600 hover:bg-emerald-700" disabled={statusMutation.isPending} onClick={() => changeStatus(selectedBooking, "COMPLETED")}>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Booking
                    </Button>
                  )}
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
                      setOverrideStatus(selectedBooking.status)
                    }}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Override Status
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
            <h1 className="text-3xl font-semibold tracking-tight">Active Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor confirmed and in-progress marketplace bookings.</p>
          </div>
          <Button className="border-white/10 bg-card/70" variant="outline" onClick={refetchAll} disabled={confirmedQuery.isFetching || inProgressQuery.isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", (confirmedQuery.isFetching || inProgressQuery.isFetching) && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Active Bookings" value={bookings.length} description="All active bookings" icon={<CalendarClock className="h-4 w-4" />} tone="green" />
          <StatCard title="Confirmed" value={confirmedCount} description="Awaiting start" icon={<Calendar className="h-4 w-4" />} tone="amber" />
          <StatCard title="In Progress" value={inProgressCount} description="Currently underway" icon={<PlayCircle className="h-4 w-4" />} tone="blue" />
          <StatCard title="Starting Today" value={todayCount} description="Scheduled today" icon={<Clock3 className="h-4 w-4" />} tone="amber" />
          <StatCard title="Overdue" value={overdueCount} description="Past expected time" icon={<AlertTriangle className="h-4 w-4" />} tone="purple" />
          <StatCard title="Reported" value={reportedCount} description="Issue signals" icon={<Flag className="h-4 w-4" />} tone="red" />
        </div>

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
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Services</SelectItem>
                <SelectItem value="HIGH_VALUE">High value</SelectItem>
                <SelectItem value="REPORTED">Reported</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="NEEDS_ATTENTION">Needs attention</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={(value) => setLocationFilter(value as LocationFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All locations</SelectItem>
                <SelectItem value="SET">Location set</SelectItem>
                <SelectItem value="MISSING">Missing location</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECENT">Recently updated</SelectItem>
                <SelectItem value="STATUS">Status</SelectItem>
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

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/5 bg-card/70 p-2">
          {[
            ["ALL", "All Bookings", bookings.length],
            ["IN_PROGRESS", "In Progress", inProgressCount],
            ["CONFIRMED", "Confirmed", confirmedCount],
            ["NEEDS_ATTENTION", "Needs Attention", needsAttentionCount],
            ["OVERDUE", "Overdue", overdueCount],
          ].map(([value, label, count]) => (
            <button
              key={String(value)}
              className={cn(
                "rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                statusFilter === value && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              )}
              onClick={() => setStatusFilter(value as StatusFilter)}
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
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-300" />
            <p className="font-medium">Could not load active bookings</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
            <Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No active bookings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking the backend data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid min-w-[980px] grid-cols-[1.35fr_1fr_1fr_.9fr_1fr_.7fr_.9fr_86px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div>Booking</div>
              <div>Employer</div>
              <div>Provider</div>
              <div>Status</div>
              <div>Schedule</div>
              <div>Price</div>
              <div>Last Update</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                {filteredBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    className="grid w-full grid-cols-[1.35fr_1fr_1fr_.9fr_1fr_.7fr_.9fr_86px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
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
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-200 ring-1 ring-white/10">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold">{bookingTitle(booking)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{bookingCode(booking, index)}</p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fullName(booking.employer)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{booking.employer.phoneNumber || "No phone"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{fullName(booking.worker)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{booking.worker.phoneNumber || "No phone"}</p>
                    </div>
                    <div className="min-w-0">
                      <Badge className={statusBadgeClass(booking.status)}>{displayStatus(booking.status)}</Badge>
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
                    <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                      <Button
                        className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
                        size="sm"
                        onClick={() => {
                          setSelectedId(booking.id)
                          setShowDetail(true)
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 to {filteredBookings.length} of {bookings.length} bookings</span>
              <span>10 / page</span>
            </div>
          </div>
        )}
      </div>
      {overrideDialog}
    </div>
  )
}
