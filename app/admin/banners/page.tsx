"use client"

import React, { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  CalendarClock,
  Eye,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import axiosInstance from "@/lib/axios-instance"
import { cn } from "@/lib/utils"
import { AdminPageHeader, AdminStatCard, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

type MediaType = "IMAGE" | "VIDEO"

interface HeroBanner {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  mediaType?: MediaType
  uploadedFileName?: string | null
  ctaText: string | null
  ctaLink: string | null
  sortOrder: number
  isActive: boolean
  archivedAt?: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt?: string
}

type BannerForm = {
  title: string
  subtitle: string
  imageUrl: string
  mediaType: MediaType
  uploadedFileName: string
  ctaText: string
  ctaLink: string
  sortOrder: number
  isActive: boolean
  startDate: string
  endDate: string
}

const emptyForm: BannerForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mediaType: "IMAGE",
  uploadedFileName: "",
  ctaText: "Browse Services",
  ctaLink: "/service?category=all",
  sortOrder: 0,
  isActive: false,
  startDate: "",
  endDate: "",
}

const ctaPresets = [
  { label: "Browse Services", href: "/service?category=all" },
  { label: "Post a Job", href: "/jobs/create" },
  { label: "Find Providers", href: "/service?serviceType=INDIVIDUAL" },
  { label: "View Companies", href: "/service?serviceType=COMPANY" },
]

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : ""
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date"
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function isBannerLive(banner: HeroBanner) {
  const now = new Date()
  const startsOk = !banner.startDate || new Date(banner.startDate) <= now
  const endsOk = !banner.endDate || new Date(banner.endDate) >= now
  return banner.isActive && !banner.archivedAt && startsOk && endsOk
}

function getBannerStatus(banner: HeroBanner) {
  if (banner.archivedAt) return { label: "Archived", tone: "muted" as const }
  if (!banner.isActive) return { label: "Draft", tone: "draft" as const }
  if (banner.startDate && new Date(banner.startDate) > new Date()) return { label: "Scheduled", tone: "scheduled" as const }
  if (banner.endDate && new Date(banner.endDate) < new Date()) return { label: "Ended", tone: "muted" as const }
  return { label: "Live", tone: "live" as const }
}

function buildPayload(data: BannerForm) {
  return {
    ...data,
    title: data.title.trim() || null,
    subtitle: data.subtitle.trim() || null,
    imageUrl: data.imageUrl.trim(),
    ctaText: data.ctaText.trim() || null,
    ctaLink: data.ctaLink.trim() || null,
    uploadedFileName: data.uploadedFileName.trim() || null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
  }
}

function MobileBannerPreview({ form }: { form: BannerForm }) {
  const title = form.title || "Find trusted help, get things done."
  const subtitle = form.subtitle || "Verified professionals for your home and daily needs."
  const ctaText = form.ctaText || "Browse Services"

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#ecfaec] p-3 text-slate-950 shadow-2xl shadow-black/30">
      <div className="relative flex min-h-[176px] overflow-hidden rounded-2xl">
        <div className="z-10 flex flex-1 flex-col justify-center gap-2 p-4">
          <div className="flex flex-wrap gap-1.5">
            {["Ad", "Trusted", "Huza"].map((badge) => (
              <span key={badge} className="rounded-full border border-emerald-700/25 bg-white/65 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                {badge}
              </span>
            ))}
          </div>
          <h3 className="max-w-[170px] text-[18px] font-black leading-tight text-slate-900">{title}</h3>
          <p className="max-w-[170px] text-[11px] font-medium leading-relaxed text-slate-600">{subtitle}</p>
          <div>
            <span className="inline-flex rounded-lg bg-emerald-800 px-3 py-2 text-[11px] font-bold text-white">
              {ctaText}
            </span>
          </div>
        </div>
        <div className="relative w-[126px] shrink-0 overflow-hidden rounded-l-[28px] bg-emerald-900/10">
          {form.imageUrl ? (
            form.mediaType === "VIDEO" ? (
              <video src={form.imageUrl} className="h-full w-full object-cover" muted playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="Banner preview" className="h-full w-full object-cover object-center" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-emerald-900/50">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        <span className="h-2 w-4 rounded-full bg-emerald-800" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
      </div>
    </div>
  )
}

function StatusBadge({ banner }: { banner: HeroBanner }) {
  const status = getBannerStatus(banner)
  return (
    <Badge
      variant={status.tone === "muted" ? "outline" : "secondary"}
      className={cn(
        "min-w-[76px] justify-center",
        status.tone === "live" && "border-transparent bg-emerald-500/15 text-emerald-300",
        status.tone === "scheduled" && "border-transparent bg-sky-500/15 text-sky-300",
        status.tone === "draft" && "border-transparent bg-zinc-500/20 text-zinc-300",
      )}
    >
      {status.label}
    </Badge>
  )
}

export default function BannersPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HeroBanner | null>(null)
  const [formData, setFormData] = useState<BannerForm>(emptyForm)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: banners = [], isLoading } = useQuery<HeroBanner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/banners")
      return res.data?.data ?? res.data
    },
  })

  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.sortOrder - b.sortOrder || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [banners],
  )

  const visibleBanners = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sortedBanners.filter((banner) => {
      const status = getBannerStatus(banner).label.toLowerCase()
      const matchesStatus = statusFilter === "all" || status === statusFilter
      const haystack = [banner.title, banner.subtitle, banner.ctaText, banner.ctaLink].filter(Boolean).join(" ").toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [search, sortedBanners, statusFilter])

  const stats = useMemo(
    () => ({
      total: banners.length,
      live: banners.filter(isBannerLive).length,
      scheduled: banners.filter((banner) => getBannerStatus(banner).label === "Scheduled").length,
      drafts: banners.filter((banner) => getBannerStatus(banner).label === "Draft").length,
    }),
    [banners],
  )

  const activePreview = sortedBanners.filter((banner) => !banner.archivedAt && banner.isActive)

  const saveMutation = useMutation({
    mutationFn: (data: BannerForm) => {
      const payload = buildPayload(data)
      if (editing) return axiosInstance.patch(`/admin/banners/${editing.id}`, payload)
      return axiosInstance.post("/admin/banners", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
      toast({ title: editing ? "Banner updated" : "Banner created", description: "The home advertisement was saved." })
      setIsDialogOpen(false)
      setEditing(null)
      setFormData(emptyForm)
    },
    onError: (err: any) => {
      toast({ title: "Could not save banner", description: err.response?.data?.message || "Please check the banner fields.", variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeroBanner> }) => axiosInstance.patch(`/admin/banners/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.response?.data?.message || "Could not update banner.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
      toast({ title: "Banner deleted" })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const data = new FormData()
      data.append("file", file)
      const res = await axiosInstance.post("/admin/banners/media", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return res.data?.data ?? res.data
    },
    onSuccess: (uploaded) => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        mediaType: uploaded.mediaType,
        uploadedFileName: uploaded.uploadedFileName || "",
      }))
      toast({ title: "Media uploaded", description: "The mobile preview is ready." })
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.response?.data?.message || "Could not upload media.", variant: "destructive" })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm, sortOrder: banners.length + 1 })
    setIsDialogOpen(true)
  }

  const openEdit = (banner: HeroBanner) => {
    setEditing(banner)
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl,
      mediaType: banner.mediaType || "IMAGE",
      uploadedFileName: banner.uploadedFileName || "",
      ctaText: banner.ctaText || "",
      ctaLink: banner.ctaLink || "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive && !banner.archivedAt,
      startDate: toDateInput(banner.startDate),
      endDate: toDateInput(banner.endDate),
    })
    setIsDialogOpen(true)
  }

  const archiveBanner = (banner: HeroBanner) => {
    updateMutation.mutate({
      id: banner.id,
      data: { isActive: false, archivedAt: new Date().toISOString() },
    })
  }

  return (
    <div className="space-y-5 p-6">
      <AdminPageHeader
        title="Hero Banners"
        description="Manage home-screen advertisements. Upload creative, schedule campaigns, and publish without developer help."
      >
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-banners"] })}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </AdminPageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="Total Campaigns" value={stats.total} description="All banners" icon={Megaphone} tone="green" />
        <AdminStatCard title="Live Now" value={stats.live} description="Visible on home" icon={Eye} tone="blue" />
        <AdminStatCard title="Scheduled" value={stats.scheduled} description="Starts later" icon={CalendarClock} tone="amber" />
        <AdminStatCard title="Drafts" value={stats.drafts} description="Not visible" icon={ImageIcon} tone="purple" />
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Home Carousel Preview</p>
                <p className="mt-1 text-sm text-muted-foreground">Only active, non-archived banners appear here in sort order.</p>
              </div>
              <Badge variant="outline">{activePreview.length} active</Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {activePreview.length ? (
                activePreview.map((banner) => (
                  <div key={banner.id} className="relative h-28 w-56 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-muted">
                    {banner.mediaType === "VIDEO" ? (
                      <video src={banner.imageUrl} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={banner.imageUrl} alt={banner.title || "banner"} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{banner.title || "Untitled banner"}</p>
                        {banner.ctaText ? <p className="truncate text-xs text-white/75">{banner.ctaText}</p> : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-muted-foreground">
                  No active banners. Publish one to show it on the home screen.
                </div>
              )}
            </div>
          </div>
          <MobileBannerPreview form={formData.imageUrl || editing ? formData : { ...emptyForm, title: activePreview[0]?.title || "", subtitle: activePreview[0]?.subtitle || "", imageUrl: activePreview[0]?.imageUrl || "", ctaText: activePreview[0]?.ctaText || "", mediaType: activePreview[0]?.mediaType || "IMAGE" }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search campaign, CTA, or link..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visibleBanners.length === 0 ? (
        <EmptyState title="No banners found" description="Create a banner or adjust your filters." icon={ImageIcon} />
      ) : (
        <div className="space-y-3">
          {visibleBanners.map((banner) => (
            <Card key={banner.id} className={cn((!banner.isActive || banner.archivedAt) && "opacity-70")}>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[112px_1fr_auto] lg:items-center">
                <div className="h-20 overflow-hidden rounded-lg border border-white/10 bg-muted">
                  {banner.mediaType === "VIDEO" ? (
                    <video src={banner.imageUrl} className="h-full w-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.imageUrl} alt={banner.title || "banner"} className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-semibold text-foreground">{banner.title || "Untitled campaign"}</p>
                    <StatusBadge banner={banner} />
                  </div>
                  {banner.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{banner.subtitle}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Order {banner.sortOrder}</span>
                    <span className="inline-flex items-center gap-1">
                      {banner.mediaType === "VIDEO" ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      {banner.mediaType || "IMAGE"}
                    </span>
                    <span>{banner.ctaText || "No CTA"} {banner.ctaLink ? `-> ${banner.ctaLink}` : ""}</span>
                    <span>{formatShortDate(banner.startDate)} - {formatShortDate(banner.endDate)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">Visible</span>
                    <Switch
                      checked={banner.isActive && !banner.archivedAt}
                      onCheckedChange={(value) => updateMutation.mutate({ id: banner.id, data: { isActive: value, archivedAt: value ? null : banner.archivedAt } })}
                      disabled={!!banner.archivedAt}
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => openEdit(banner)} aria-label="Edit banner">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => archiveBanner(banner)} disabled={!!banner.archivedAt} aria-label="Archive banner">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this banner permanently?")) deleteMutation.mutate(banner.id)
                    }}
                    aria-label="Delete banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Advertisement" : "Create Advertisement"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 pt-2 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <section className="rounded-lg border border-white/10 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Creative</h3>
                  <p className="text-xs text-muted-foreground">Use a clear mobile-friendly image. The right side is cropped on the home card.</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Upload media</Label>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) uploadMutation.mutate(file)
                        }}
                      />
                      <Button variant="outline" disabled={uploadMutation.isPending}>
                        {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Media URL <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="https://... image or video URL"
                      value={formData.imageUrl}
                      onChange={(event) => setFormData({ ...formData, imageUrl: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Media type</Label>
                    <Select value={formData.mediaType} onValueChange={(value) => setFormData({ ...formData, mediaType: value as MediaType })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Media type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMAGE">Image</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-white/10 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Message</h3>
                  <p className="text-xs text-muted-foreground">Keep it short. The home card has limited space on mobile.</p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Headline <span className="text-destructive">*</span></Label>
                    <Input
                      maxLength={64}
                      placeholder="Find trusted help, get things done."
                      value={formData.title}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    />
                    <p className="text-right text-xs text-muted-foreground">{formData.title.length}/64</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Supporting copy</Label>
                    <Textarea
                      maxLength={120}
                      placeholder="Verified professionals for your home and daily needs."
                      value={formData.subtitle}
                      onChange={(event) => setFormData({ ...formData, subtitle: event.target.value })}
                    />
                    <p className="text-right text-xs text-muted-foreground">{formData.subtitle.length}/120</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-white/10 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Action and schedule</h3>
                  <p className="text-xs text-muted-foreground">Choose where the ad sends users and when it should run.</p>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>CTA preset</Label>
                    <Select
                      value={ctaPresets.find((preset) => preset.href === formData.ctaLink && preset.label === formData.ctaText)?.href || "custom"}
                      onValueChange={(value) => {
                        if (value === "custom") return
                        const preset = ctaPresets.find((item) => item.href === value)
                        if (preset) setFormData({ ...formData, ctaText: preset.label, ctaLink: preset.href })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="CTA preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {ctaPresets.map((preset) => (
                          <SelectItem key={preset.href} value={preset.href}>{preset.label}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Button text</Label>
                      <Input value={formData.ctaText} onChange={(event) => setFormData({ ...formData, ctaText: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Button link</Label>
                      <Input placeholder="/service?category=all" value={formData.ctaLink} onChange={(event) => setFormData({ ...formData, ctaLink: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Order</Label>
                      <Input type="number" min={0} value={formData.sortOrder} onChange={(event) => setFormData({ ...formData, sortOrder: Number(event.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start date</Label>
                      <Input type="date" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>End date</Label>
                      <Input type="date" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                    <div>
                      <Label>Publish on home screen</Label>
                      <p className="text-xs text-muted-foreground">Turn this off to save as draft.</p>
                    </div>
                    <Switch checked={formData.isActive} onCheckedChange={(value) => setFormData({ ...formData, isActive: value })} />
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-3">
              <MobileBannerPreview form={formData} />
              <Card>
                <CardContent className="space-y-3 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={formData.isActive ? "default" : "secondary"}>{formData.isActive ? "Ready to publish" : "Draft"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Creative</span>
                    <span className={formData.imageUrl ? "text-emerald-300" : "text-amber-300"}>{formData.imageUrl ? "Added" : "Missing"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Headline</span>
                    <span className={formData.title.trim() ? "text-emerald-300" : "text-amber-300"}>{formData.title.trim() ? "Added" : "Missing"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">CTA</span>
                    <span>{formData.ctaText || "None"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!formData.imageUrl.trim() || !formData.title.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
