"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react"
import type { Service } from "@/lib/api"
import { deleteService, getAllServices, updateService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type StatusFilter = "ALL" | "ACTIVE" | "HIDDEN" | "FLAGGED" | "NEEDS_REVIEW"
type QualityFilter = "ALL" | "HIGH_REHIRE" | "HAS_BOOKINGS" | "INCOMPLETE"
type SortMode = "RECENT" | "BOOKINGS" | "REHIRE" | "PRICE_HIGH" | "PRICE_LOW"

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

function formatMoney(value?: number | null) {
  return currencyFormatter.format(Number(value) || 0)
}

function priceLabel(service: Service) {
  const min = formatMoney(service.priceMin)
  const max = formatMoney(service.priceMax)
  return `${min} - ${max} RWF`
}

function priceTypeLabel(value?: string | null) {
  if (!value) return "per service"
  return value.replace("_", " ").toLowerCase()
}

// Would-rehire rate (0-100) from real review data, or null when not enough
// answered reviews exist. The platform has no numeric rating.
function rehireRateFor(service: Service): number | null {
  return service.rehireStats?.rate ?? null
}

function statusFor(service: Service): "Active" | "Hidden" | "Flagged" | "Needs Review" {
  if (!service.isActive) return "Hidden"
  const rate = rehireRateFor(service)
  const answered = service.rehireStats?.answered ?? 0
  // Flag listings with a poor rehire signal once there's enough feedback.
  if (answered >= 3 && rate !== null && rate < 50) return "Flagged"
  if (completenessScore(service) < 75) return "Needs Review"
  return "Active"
}

function statusClass(status: ReturnType<typeof statusFor>) {
  if (status === "Active") return "bg-emerald-500/15 text-emerald-300"
  if (status === "Hidden") return "bg-muted text-muted-foreground"
  if (status === "Flagged") return "border border-red-500/60 bg-red-500/10 text-red-300"
  return "bg-amber-500/10 text-amber-300"
}

function completionChecks(service: Service) {
  return [
    { label: "Photo", complete: Boolean(service.serviceImage) },
    { label: "Description", complete: Boolean(service.description?.trim()) },
    { label: "Price", complete: service.priceMin !== null && service.priceMax !== null },
    { label: "Availability", complete: Boolean(service.priceType) },
    { label: "Location", complete: Boolean(service.serviceAreas?.length) },
  ]
}

function completenessScore(service: Service) {
  const checks = completionChecks(service)
  const complete = checks.filter((check) => check.complete).length
  return Math.round((complete / checks.length) * 100)
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

function ServiceImage({ service, size = "small" }: { service: Service; size?: "small" | "large" }) {
  const dimensions = size === "large" ? "h-56 w-full" : "h-10 w-12"
  if (service.serviceImage) {
    return <img src={service.serviceImage} alt="" className={cn(dimensions, "rounded-md border border-white/10 object-cover")} />
  }
  return (
    <div className={cn(dimensions, "flex items-center justify-center rounded-md border border-white/10 bg-muted/40 text-muted-foreground")}>
      <Layers className={size === "large" ? "h-8 w-8" : "h-4 w-4"} />
    </div>
  )
}

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [adminNote, setAdminNote] = useState("")

  const { data: services = [], isLoading, isError, isFetching, refetch } = useQuery<Service[]>({
    queryKey: ["admin-services"],
    queryFn: getAllServices,
  })

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] })
      toast({ title: "Service updated" })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update service.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] })
      toast({ title: "Service deleted" })
      setShowDetail(false)
      setSelectedId(null)
    },
  })

  const categories = useMemo(() => Array.from(new Set(services.map((service) => service.category.name))).sort(), [services])

  const filteredServices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...services]
      .filter((service) => {
        const status = statusFor(service)
        const haystack = `${service.description} ${fullName(service.provider)} ${service.provider.phoneNumber || ""} ${service.category.name} ${service.id}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesCategory = categoryFilter === "ALL" || service.category.name === categoryFilter
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" && status === "Active") ||
          (statusFilter === "HIDDEN" && status === "Hidden") ||
          (statusFilter === "FLAGGED" && status === "Flagged") ||
          (statusFilter === "NEEDS_REVIEW" && status === "Needs Review")
        const matchesQuality =
          qualityFilter === "ALL" ||
          (qualityFilter === "HIGH_REHIRE" && (rehireRateFor(service) ?? 0) >= 80) ||
          (qualityFilter === "HAS_BOOKINGS" && (service._count?.bookings ?? 0) > 0) ||
          (qualityFilter === "INCOMPLETE" && completenessScore(service) < 100)
        return matchesSearch && matchesCategory && matchesStatus && matchesQuality
      })
      .sort((a, b) => {
        if (sortMode === "BOOKINGS") return (b._count?.bookings ?? 0) - (a._count?.bookings ?? 0)
        if (sortMode === "REHIRE") return (rehireRateFor(b) ?? -1) - (rehireRateFor(a) ?? -1)
        if (sortMode === "PRICE_HIGH") return (Number(b.priceMax) || 0) - (Number(a.priceMax) || 0)
        if (sortMode === "PRICE_LOW") return (Number(a.priceMin) || 0) - (Number(b.priceMin) || 0)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [categoryFilter, qualityFilter, searchTerm, services, sortMode, statusFilter])

  const selectedService = filteredServices.find((service) => service.id === selectedId) ?? filteredServices[0] ?? null
  const activeCount = services.filter((service) => statusFor(service) === "Active").length
  const hiddenCount = services.filter((service) => statusFor(service) === "Hidden").length
  const flaggedCount = services.filter((service) => statusFor(service) === "Flagged").length
  const needsReviewCount = services.filter((service) => statusFor(service) === "Needs Review").length
  const withBookingsCount = services.filter((service) => (service._count?.bookings ?? 0) > 0).length
  const ratedServices = services.filter((service) => rehireRateFor(service) !== null)
  const averageRehire = ratedServices.length
    ? `${Math.round(ratedServices.reduce((sum, service) => sum + (rehireRateFor(service) ?? 0), 0) / ratedServices.length)}%`
    : "—"

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
    setQualityFilter("ALL")
    setCategoryFilter("ALL")
    setSortMode("RECENT")
  }

  const toggleServiceVisibility = (service: Service) => {
    saveMutation.mutate({ id: service.id, data: { isActive: !service.isActive } })
  }

  if (showDetail && selectedService) {
    const providerName = fullName(selectedService.provider)
    const status = statusFor(selectedService)
    const rehireRate = rehireRateFor(selectedService)
    const rehireLabel = rehireRate === null ? "—" : `${rehireRate}%`
    const score = completenessScore(selectedService)
    const bookings = selectedService._count?.bookings ?? 0
    const reviews = selectedService._count?.reviews ?? 0
    const saves = selectedService._count?.bookmarks ?? 0
    const serviceAreas = selectedService.serviceAreas?.length ? selectedService.serviceAreas.join(", ") : "Not provided"

    return (
      <div className="min-h-screen bg-[#101211] p-6">
        <div className="mx-auto max-w-[1780px] space-y-4">
          <header className="flex flex-col gap-4 border-b border-white/5 pb-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <button className="mb-3 inline-flex items-center text-sm text-emerald-300 hover:text-emerald-200" onClick={() => setShowDetail(false)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Service Listings
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="line-clamp-2 text-3xl font-semibold tracking-tight">{selectedService.category.name}</h1>
                <Badge className={statusClass(status)}>{status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{providerName} · @{selectedService.provider.firstName?.toLowerCase() || "provider"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="border-white/10 bg-card/70" variant="outline" onClick={() => toggleServiceVisibility(selectedService)} disabled={saveMutation.isPending}>
                {selectedService.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {selectedService.isActive ? "Hide Service" : "Activate Service"}
              </Button>
              <Button className="border-white/10 bg-card/70" variant="outline" disabled>
                <Star className="mr-2 h-4 w-4" />
                Feature Service
              </Button>
              <Button className="border-white/10 bg-card/70" variant="outline" disabled>
                <Eye className="mr-2 h-4 w-4" />
                View Public Preview
              </Button>
            </div>
          </header>

          <div className="grid gap-3 rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10 md:grid-cols-3 xl:grid-cols-6">
            <div>
              <p className="text-xs text-muted-foreground">Service Type</p>
              <p className="mt-1 text-sm font-semibold">{selectedService.category.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price Range</p>
              <p className="mt-1 text-sm font-semibold">{priceLabel(selectedService)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing Type</p>
              <p className="mt-1 text-sm font-semibold capitalize">{priceTypeLabel(selectedService.priceType)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Availability</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">{selectedService.isActive ? "Available" : "Hidden"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="mt-1 truncate text-sm font-semibold">{serviceAreas}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(selectedService.createdAt)}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
                <section className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="mb-4 flex items-center gap-2 font-semibold">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Public Preview
                  </p>
                  <ServiceImage service={selectedService} size="large" />
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-200">
                        {initials(providerName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{providerName}</p>
                        <p className="text-sm text-muted-foreground">@{selectedService.provider.firstName?.toLowerCase() || "provider"}</p>
                      </div>
                    </div>
                    <h2 className="mt-4 text-xl font-semibold">{selectedService.category.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedService.category.name}</p>
                    <p className="mt-3 text-lg font-semibold text-emerald-300">{priceLabel(selectedService)}</p>
                    <div className="mt-4 grid grid-cols-4 overflow-hidden rounded-lg border border-white/5 bg-background/35 text-center text-sm">
                      <div className="p-3">
                        <BriefcaseBusiness className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{bookings}</p>
                        <p className="text-xs text-muted-foreground">Jobs</p>
                      </div>
                      <div className="border-l border-white/5 p-3">
                        <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-emerald-300" />
                        <p className="font-semibold">{rehireLabel}</p>
                        <p className="text-xs text-muted-foreground">Rehire</p>
                      </div>
                      <div className="border-l border-white/5 p-3">
                        <Bookmark className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{saves}</p>
                        <p className="text-xs text-muted-foreground">Saves</p>
                      </div>
                      <div className="border-l border-white/5 p-3">
                        <MapPin className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <p className="truncate font-semibold">{selectedService.serviceAreas?.[0] || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">Area</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="mb-4 flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Quality & Trust
                  </p>
                  <div className="grid gap-3 md:grid-cols-5">
                    <div>
                      <p className="text-lg font-semibold text-emerald-300">{rehireLabel}</p>
                      <p className="text-xs text-muted-foreground">Would rehire</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{reviews}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{bookings}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{saves}</p>
                      <p className="text-xs text-muted-foreground">Saves</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-red-300">{status === "Flagged" ? 1 : 0}</p>
                      <p className="text-xs text-muted-foreground">Reports</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                      <p className="text-sm font-semibold">Profile Completeness</p>
                      <div className="mt-3 space-y-2">
                        {completionChecks(selectedService).map((check) => (
                          <div key={check.label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{check.label}</span>
                            <span className={check.complete ? "text-emerald-300" : "text-amber-300"}>{check.complete ? "Yes" : "Missing"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-lg border border-white/5 bg-background/35 p-4">
                      <div className="text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-emerald-500/80 text-xl font-semibold">
                          {score}%
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Complete</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <section className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="font-semibold">About</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedService.description || "No service description provided."}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                  <p className="font-semibold">Services Offered</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    {[selectedService.category.name, "Customer coordination", "Task completion"].map((item) => (
                      <span key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Work Photos</p>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="aspect-[4/3] overflow-hidden rounded-lg border border-white/5 bg-background/35">
                      {index === 0 ? (
                        <ServiceImage service={selectedService} size="large" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-white/5 bg-card/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Review Summary</p>
                  <Link href="/admin/reviews" className="text-xs text-emerald-300 hover:underline">
                    Open reviews
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-white/5 text-center text-sm">
                  <div className="p-4">
                    <p className="text-lg font-semibold text-emerald-300">{rehireLabel}</p>
                    <p className="text-xs text-muted-foreground">Would rehire</p>
                  </div>
                  <div className="border-l border-white/5 p-4">
                    <p className="text-lg font-semibold">{selectedService.rehireStats?.answered ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Rehire answers</p>
                  </div>
                  <div className="border-l border-white/5 p-4">
                    <p className="text-lg font-semibold">{reviews}</p>
                    <p className="text-xs text-muted-foreground">Total reviews</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Open the Reviews page to read and moderate individual reviews for this provider.
                </p>
              </section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Service Status</p>
                <Badge className={cn("mt-4", statusClass(status))}>{status}</Badge>
                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedService.isActive ? "This service is visible to users." : "This service is hidden from users."}
                </p>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Admin Actions</p>
                <div className="mt-4 grid gap-2">
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" onClick={() => toggleServiceVisibility(selectedService)} disabled={saveMutation.isPending}>
                    {selectedService.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {selectedService.isActive ? "Hide Service" : "Activate Service"}
                  </Button>
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <Flag className="mr-2 h-4 w-4" />
                    Mark Needs Review
                  </Button>
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <Star className="mr-2 h-4 w-4" />
                    Feature Service
                  </Button>
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <UserRound className="mr-2 h-4 w-4" />
                    View Provider
                  </Button>
                  <Button
                    className="h-9 justify-start border-red-500/60 bg-transparent text-red-300 hover:bg-red-500/10"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this service listing permanently?")) deleteMutation.mutate(selectedService.id)
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Service
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4">
                <p className="font-semibold">Admin Notes</p>
                <p className="mt-1 text-xs text-muted-foreground">Internal note visible to admins only</p>
                <Textarea
                  className="mt-3 min-h-[120px] border-white/10 bg-background/60"
                  placeholder="Add internal note..."
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  maxLength={500}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{adminNote.length} / 500</span>
                  <Button className="h-8" size="sm" disabled={!adminNote.trim()}>
                    Save Note
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1780px] space-y-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Service Listings</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage provider-created listings, visibility, quality signals, and marketplace readiness.</p>
          </div>
          <Button className="border-white/10 bg-card/70" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <Filter className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Listings" value={services.length} description="Provider-created" icon={<Layers className="h-4 w-4" />} tone="green" />
          <StatCard title="Active Listings" value={activeCount} description={`${services.length ? Math.round((activeCount / services.length) * 100) : 0}% of total`} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <StatCard title="Hidden Listings" value={hiddenCount} description="Not visible to users" icon={<EyeOff className="h-4 w-4" />} tone="amber" />
          <StatCard title="Flagged Listings" value={flaggedCount} description="Need admin review" icon={<Flag className="h-4 w-4" />} tone="red" />
          <StatCard title="With Bookings" value={withBookingsCount} description="Have marketplace usage" icon={<Calendar className="h-4 w-4" />} tone="blue" />
          <StatCard title="Avg Would-rehire" value={averageRehire} description="Across reviewed services" icon={<CheckCircle2 className="h-4 w-4" />} tone="purple" />
        </div>

        <div className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_150px_150px_170px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-white/10 bg-background/70 pl-9"
                placeholder="Search by listing, provider, service type, phone, or ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Service Types</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="HIDDEN">Hidden</SelectItem>
                <SelectItem value="FLAGGED">Flagged</SelectItem>
                <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
              </SelectContent>
            </Select>
            <Select value={qualityFilter} onValueChange={(value) => setQualityFilter(value as QualityFilter)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Qualities</SelectItem>
                <SelectItem value="HIGH_REHIRE">High would-rehire</SelectItem>
                <SelectItem value="HAS_BOOKINGS">Has bookings</SelectItem>
                <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECENT">Recently updated</SelectItem>
                <SelectItem value="BOOKINGS">Most bookings</SelectItem>
                <SelectItem value="REHIRE">Highest would-rehire</SelectItem>
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
            ["ALL", "All Listings", services.length],
            ["ACTIVE", "Active", activeCount],
            ["HIDDEN", "Hidden", hiddenCount],
            ["FLAGGED", "Flagged", flaggedCount],
            ["NEEDS_REVIEW", "Needs Review", needsReviewCount],
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
            <p className="font-medium">Could not load service listings</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
            <p className="font-medium">No service listings found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking backend data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid min-w-[1120px] grid-cols-[1.5fr_1fr_.9fr_1fr_.75fr_1.05fr_1fr_.75fr] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div>Service</div>
              <div>Provider</div>
              <div>Service Type</div>
              <div>Price</div>
              <div>Status</div>
              <div>Quality</div>
              <div>Completeness</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1120px]">
                {filteredServices.map((service) => {
                  const status = statusFor(service)
                  const score = completenessScore(service)
                  return (
                    <div
                      key={service.id}
                      role="button"
                      tabIndex={0}
                      className="grid w-full grid-cols-[1.5fr_1fr_.9fr_1fr_.75fr_1.05fr_1fr_.75fr] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
                      onClick={() => {
                        setSelectedId(service.id)
                        setShowDetail(true)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedId(service.id)
                          setShowDetail(true)
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ServiceImage service={service} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{service.category.name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.category.name}</p>
                        </div>
                      </div>
                      <p className="truncate text-sm">{fullName(service.provider)}</p>
                      <div>
                        <Badge variant="outline" className="border-white/10 bg-background/50">{service.category.name}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{priceLabel(service)}</p>
                        <p className="mt-0.5 text-xs italic text-muted-foreground">({priceTypeLabel(service.priceType)})</p>
                      </div>
                      <div>
                        <Badge className={statusClass(status)}>{status}</Badge>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm font-medium text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {rehireRateFor(service) === null ? "No reviews" : `${rehireRateFor(service)}% rehire`}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {service._count?.bookings ?? 0} bookings · {service._count?.reviews ?? 0} reviews · {service._count?.bookmarks ?? 0} saves
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {completionChecks(service).map((check) => (
                            <span key={check.label} className={check.complete ? "text-emerald-300" : "text-muted-foreground"}>
                              {check.complete ? "●" : "○"}
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{score}%</p>
                      </div>
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <Button
                          className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
                          size="sm"
                          onClick={() => {
                            setSelectedId(service.id)
                            setShowDetail(true)
                          }}
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 to {filteredServices.length} of {services.length} listings</span>
              <span>20 / page</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
