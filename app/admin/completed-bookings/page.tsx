"use client"

import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Filter,
  History,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  UserRound,
  Wallet,
} from "lucide-react"
import type { Booking } from "@/lib/api"
import { getBookings } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatDate } from "@/lib/utils"

type RehireValue = "YES" | "MAYBE" | "NO" | null
type RehireFilter = "ALL" | "YES" | "MAYBE" | "NO" | "NONE"
type PaymentFilter = "ALL" | "PAID" | "REFUNDED"
type DateFilter = "ALL" | "TODAY" | "WEEK" | "MONTH"
type SortMode = "RECENT" | "PRICE_HIGH" | "PRICE_LOW" | "REHIRE"

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

// The platform has no numeric rating — reviews capture a would-rehire signal.
function rehireFor(booking: Booking): RehireValue {
  const answered = booking.reviews?.find((review) => review.wouldRehire)
  return (answered?.wouldRehire ?? booking.reviews?.[0]?.wouldRehire) ?? null
}

function rehireLabel(value: RehireValue) {
  if (value === "YES") return "Would rehire"
  if (value === "MAYBE") return "Maybe"
  if (value === "NO") return "Would not rehire"
  return "No review"
}

function rehireClass(value: RehireValue) {
  if (value === "YES") return "bg-emerald-500/10 text-emerald-300"
  if (value === "MAYBE") return "bg-amber-500/10 text-amber-300"
  if (value === "NO") return "bg-red-500/10 text-red-300"
  return "bg-muted text-muted-foreground"
}

function rehireOrder(value: RehireValue) {
  return value === "YES" ? 3 : value === "MAYBE" ? 2 : value === "NO" ? 1 : 0
}

function platformFee(booking: Booking) {
  return Math.round((Number(booking.agreedPrice) || 0) * 0.1)
}

function providerPayout(booking: Booking) {
  return Math.max(0, (Number(booking.agreedPrice) || 0) - platformFee(booking))
}

function isWithinDateFilter(booking: Booking, filter: DateFilter) {
  if (filter === "ALL") return true
  const created = new Date(booking.createdAt).getTime()
  if (Number.isNaN(created)) return false
  const diff = Date.now() - created
  if (filter === "TODAY") return diff <= 24 * 60 * 60 * 1000
  if (filter === "WEEK") return diff <= 7 * 24 * 60 * 60 * 1000
  return diff <= 30 * 24 * 60 * 60 * 1000
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
    <div className="rounded-lg border border-white/5 bg-background/35 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">{label}</p>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-white/10",
            tone === "purple" ? "bg-purple-500/15 text-purple-200" : "bg-sky-500/15 text-sky-200"
          )}
        >
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{phone || "No phone"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{email || "No email"}</p>
        </div>
      </div>
      <Button className="mt-4 h-8 border-white/10 bg-background/60 text-xs" size="sm" variant="outline" disabled>
        View full profile
      </Button>
    </div>
  )
}

export default function CompletedBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [rehireFilter, setRehireFilter] = useState<RehireFilter>("ALL")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL")
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  const { data: bookings = [], isLoading, isError, isFetching, refetch } = useQuery<Booking[]>({
    queryKey: ["admin-bookings-completed"],
    queryFn: () => getBookings("COMPLETED"),
  })

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...bookings]
      .filter((booking) => {
        const haystack = `${bookingTitle(booking)} ${booking.id} ${fullName(booking.employer)} ${booking.employer.phoneNumber || ""} ${fullName(booking.worker)} ${booking.worker.phoneNumber || ""}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const rehire = rehireFor(booking)
        const matchesRehire =
          rehireFilter === "ALL" ||
          (rehireFilter === "NONE" ? rehire === null : rehire === rehireFilter)
        const matchesPayment = paymentFilter === "ALL" || paymentFilter === "PAID"
        return matchesSearch && matchesRehire && matchesPayment && isWithinDateFilter(booking, dateFilter)
      })
      .sort((a, b) => {
        if (sortMode === "PRICE_HIGH") return (Number(b.agreedPrice) || 0) - (Number(a.agreedPrice) || 0)
        if (sortMode === "PRICE_LOW") return (Number(a.agreedPrice) || 0) - (Number(b.agreedPrice) || 0)
        if (sortMode === "REHIRE") return rehireOrder(rehireFor(b)) - rehireOrder(rehireFor(a))
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [bookings, dateFilter, paymentFilter, rehireFilter, searchTerm, sortMode])

  const selectedBooking = filteredBookings.find((booking) => booking.id === selectedId) ?? filteredBookings[0] ?? null
  const totalPaid = bookings.reduce((sum, booking) => sum + (Number(booking.agreedPrice) || 0), 0)
  const rehireYesCount = bookings.filter((booking) => rehireFor(booking) === "YES").length
  const rehireAnsweredCount = bookings.filter((booking) => rehireFor(booking) !== null).length
  const rehireRate = rehireAnsweredCount ? `${Math.round((rehireYesCount / rehireAnsweredCount) * 100)}%` : "0%"

  const clearFilters = () => {
    setSearchTerm("")
    setRehireFilter("ALL")
    setPaymentFilter("ALL")
    setDateFilter("ALL")
    setSortMode("RECENT")
  }

  if (showDetail && selectedBooking) {
    const rehire = rehireFor(selectedBooking)
    const fee = platformFee(selectedBooking)
    const payout = providerPayout(selectedBooking)

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
                  <h1 className="line-clamp-2 text-3xl font-semibold tracking-tight">{bookingTitle(selectedBooking)}</h1>
                  <Badge className="bg-emerald-500/10 text-emerald-300">Completed</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Booking ID: {bookingCode(selectedBooking)}</p>
                <p className="text-sm text-muted-foreground">Completed on {formatDate(selectedBooking.createdAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => setShowDetail(false)}>
                Back to Completed
              </Button>
              <Button variant="outline" className="border-white/10 bg-card/70" disabled>
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10 md:grid-cols-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-xs text-muted-foreground">Service Type</p>
                    <p className="text-sm font-semibold">{bookingTitle(selectedBooking)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed On</p>
                    <p className="text-sm font-semibold">{formatDate(selectedBooking.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold">55 min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="text-sm font-semibold text-emerald-300">Paid</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <PersonBlock label="Employer" name={fullName(selectedBooking.employer)} phone={selectedBooking.employer.phoneNumber} email={selectedBooking.employer.email} tone="purple" />
                <PersonBlock label="Provider" name={fullName(selectedBooking.worker)} phone={selectedBooking.worker.phoneNumber} email={selectedBooking.worker.email} tone="blue" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="font-semibold">Service Details</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Job Description</dt>
                      <dd className="max-w-[220px] text-right">{selectedBooking.notes || "Completed marketplace service."}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd>{selectedBooking.service ? "Marketplace service" : "Custom booking"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Created On</dt>
                      <dd>{formatDate(selectedBooking.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="font-semibold">Location</p>
                  <p className="mt-4 text-sm text-muted-foreground">{locationText(selectedBooking)}</p>
                  <Button className="mt-4 h-8 border-white/10 bg-background/60 text-xs" variant="outline" disabled>
                    View on map
                  </Button>
                </div>
                <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="font-semibold">Schedule</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Scheduled</dt>
                      <dd className="text-right">{selectedBooking.scheduledFor ? formatDate(selectedBooking.scheduledFor) : "Not returned"}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Actual</dt>
                      <dd className="text-right">{formatDate(selectedBooking.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Reviews</p>
                  <Badge className={rehireClass(rehire)}>{rehireLabel(rehire)}</Badge>
                </div>
                {selectedBooking.reviews && selectedBooking.reviews.length > 0 ? (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {selectedBooking.reviews.map((review) => (
                      <div key={review.id} className="rounded-lg border border-white/5 bg-background/35 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">Review</p>
                          <Badge className={rehireClass(review.wouldRehire)}>{rehireLabel(review.wouldRehire)}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {review.comment || "No written comment."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No reviews submitted for this booking yet.</p>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Booking Summary</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Agreed Price</dt>
                    <dd className="font-semibold text-emerald-300">{formatMoney(selectedBooking.agreedPrice)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Platform Fee</dt>
                    <dd>{formatMoney(fee)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Provider Payout</dt>
                    <dd>{formatMoney(payout)}</dd>
                  </div>
                </dl>
                <div className="mt-5 border-t border-white/5 pt-4">
                  <p className="font-semibold">Payment Status</p>
                  <p className="mt-3 text-sm font-medium text-emerald-300">Paid</p>
                  <p className="mt-1 text-sm text-muted-foreground">Transaction ID: MMZSS{selectedBooking.id.slice(0, 10).toUpperCase()}</p>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Booking Timeline</p>
                <div className="mt-4 space-y-3 text-sm">
                  {["Created", "Accepted", "Confirmed", "Started", "Completed"].map((item) => (
                    <div key={item} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {item}
                      </span>
                      <span className="text-muted-foreground">{formatDate(selectedBooking.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Admin Note</p>
                <p className="mt-1 text-xs text-muted-foreground">Internal note visible to admins only</p>
                <Textarea
                  className="mt-3 min-h-[96px] border-white/10 bg-background/60"
                  placeholder="Add internal note..."
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  maxLength={500}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{adminNote.length} / 500</span>
                  <Button className="h-8" size="sm" disabled={!adminNote.trim()}>
                    Save note
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Actions</p>
                <div className="mt-4 grid gap-2">
                  <Button className="h-9 border-white/10 bg-background/60" variant="outline" disabled>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Conversation
                  </Button>
                  <Button className="h-9 border-white/10 bg-background/60" variant="outline" disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </Button>
                  <Button className="h-9 border-white/10 bg-background/60" variant="outline" disabled>
                    <History className="mr-2 h-4 w-4" />
                    View Full History
                  </Button>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1780px] space-y-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Completed Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review completed jobs, rehire signals, payments, and dispute outcomes.</p>
          </div>
          <Button className="border-white/10 bg-card/70" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Completed Bookings" value={bookings.length} description="All time" icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <StatCard title="Successfully Completed" value={bookings.length} description="Completed status" icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <StatCard title="Would-rehire Rate" value={rehireRate} description={`${rehireYesCount} of ${rehireAnsweredCount} reviewed`} icon={<CheckCircle2 className="h-4 w-4" />} tone="amber" />
          <StatCard title="Total Paid" value={formatMoney(totalPaid)} description="All time" icon={<Wallet className="h-4 w-4" />} tone="blue" />
          <StatCard title="Disputes Closed" value={0} description="Backend pending" icon={<History className="h-4 w-4" />} tone="purple" />
          <StatCard title="Refunds Issued" value={0} description="Backend pending" icon={<CreditCard className="h-4 w-4" />} tone="amber" />
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
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="WEEK">This week</SelectItem>
                <SelectItem value="MONTH">This month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(value) => setPaymentFilter(value as PaymentFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All payments</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={rehireFilter} onValueChange={(value) => setRehireFilter(value as RehireFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All reviews</SelectItem>
                <SelectItem value="YES">Would rehire</SelectItem>
                <SelectItem value="MAYBE">Maybe</SelectItem>
                <SelectItem value="NO">Would not rehire</SelectItem>
                <SelectItem value="NONE">No review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECENT">Recently completed</SelectItem>
                <SelectItem value="REHIRE">Would rehire first</SelectItem>
                <SelectItem value="PRICE_HIGH">Price high to low</SelectItem>
                <SelectItem value="PRICE_LOW">Price low to high</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 border-white/10 bg-background/70" variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/5 bg-card/70 p-2">
          {[
            ["ALL", "All Completed", bookings.length],
            ["YES", "Would rehire", rehireYesCount],
            ["NO", "Would not rehire", bookings.filter((booking) => rehireFor(booking) === "NO").length],
            ["NONE", "No review", bookings.filter((booking) => rehireFor(booking) === null).length],
          ].map(([value, label, count]) => (
            <button
              key={String(value)}
              className={cn(
                "rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                rehireFilter === value && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              )}
              onClick={() => setRehireFilter(value as RehireFilter)}
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
            <p className="font-medium">Could not load completed bookings</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
            <p className="font-medium">No completed bookings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking backend data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid min-w-[980px] grid-cols-[1.35fr_1fr_1fr_1fr_.75fr_.85fr_86px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div>Booking</div>
              <div>Employer</div>
              <div>Provider</div>
              <div>Completed On</div>
              <div>Price</div>
              <div>Would rehire</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                {filteredBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    className="grid w-full grid-cols-[1.35fr_1fr_1fr_1fr_.75fr_.85fr_86px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
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
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-white/10">
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
                    <div>
                      <p className="text-sm font-medium">{relativeDate(booking.createdAt)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(booking.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{currencyFormatter.format(Number(booking.agreedPrice) || 0)}</p>
                      <p className="text-xs text-muted-foreground">RWF</p>
                    </div>
                    <div>
                      <Badge className={cn("text-xs", rehireClass(rehireFor(booking)))}>
                        {rehireLabel(rehireFor(booking))}
                      </Badge>
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
    </div>
  )
}
