"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Archive, Loader2, Plus, Edit, Trash2, Image as ImageIcon, ExternalLink, GripVertical, Upload, Video } from "lucide-react"

interface HeroBanner {
  id: string
  title: string | null
  subtitle: string | null
  imageUrl: string
  mediaType?: "IMAGE" | "VIDEO"
  uploadedFileName?: string | null
  ctaText: string | null
  ctaLink: string | null
  sortOrder: number
  isActive: boolean
  archivedAt?: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
}

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  mediaType: "IMAGE" as "IMAGE" | "VIDEO",
  uploadedFileName: "",
  ctaText: "",
  ctaLink: "",
  sortOrder: 0,
  isActive: true,
  startDate: "",
  endDate: "",
}

export default function BannersPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<HeroBanner | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const { data: banners, isLoading } = useQuery<HeroBanner[]>({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/banners")
      return res.data?.data ?? res.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload = {
        ...data,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        title: data.title || null,
        subtitle: data.subtitle || null,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
        uploadedFileName: data.uploadedFileName || null,
      }
      if (editing) return axiosInstance.patch(`/admin/banners/${editing.id}`, payload)
      return axiosInstance.post("/admin/banners", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
      toast({ title: editing ? "Updated" : "Created", description: "Banner saved." })
      setIsDialogOpen(false)
      setEditing(null)
      setFormData(emptyForm)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Save failed.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
      toast({ title: "Deleted" })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeroBanner> }) =>
      axiosInstance.patch(`/admin/banners/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
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
      toast({ title: "Media uploaded", description: "Preview is ready." })
    },
    onError: (err: any) => {
      toast({ title: "Upload failed", description: err.response?.data?.message || "Could not upload media.", variant: "destructive" })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm, sortOrder: (banners?.length ?? 0) })
    setIsDialogOpen(true)
  }

  const openEdit = (b: HeroBanner) => {
    setEditing(b)
    setFormData({
      title: b.title || "",
      subtitle: b.subtitle || "",
      imageUrl: b.imageUrl,
      mediaType: b.mediaType || "IMAGE",
      uploadedFileName: b.uploadedFileName || "",
      ctaText: b.ctaText || "",
      ctaLink: b.ctaLink || "",
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      startDate: b.startDate ? b.startDate.slice(0, 10) : "",
      endDate: b.endDate ? b.endDate.slice(0, 10) : "",
    })
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hero Banners</h1>
          <p className="text-sm text-muted-foreground mt-1">Control the carousel shown on the home screen. Drag to reorder.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </Button>
      </div>

      {/* Live preview strip */}
      {banners && banners.filter(b => b.isActive && !b.archivedAt).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Active banners preview</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {banners.filter(b => b.isActive && !b.archivedAt).map(b => (
                <div key={b.id} className="relative shrink-0 w-48 h-24 rounded-lg overflow-hidden border bg-muted">
                  {b.mediaType === "VIDEO" ? (
                    <video src={b.imageUrl} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt={b.title || "banner"} className="w-full h-full object-cover" />
                  )}
                  {b.title && (
                    <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                      <p className="text-white text-xs font-semibold truncate">{b.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !banners?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="p-4 bg-muted rounded-full"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
            <div>
              <p className="font-semibold">No banners yet</p>
              <p className="text-sm text-muted-foreground">Add your first banner to start advertising on the home screen.</p>
            </div>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Banner</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.sort((a, b) => a.sortOrder - b.sortOrder).map((banner) => (
            <Card key={banner.id} className={!banner.isActive || banner.archivedAt ? "opacity-60" : ""}>
              <CardContent className="p-4 flex gap-4 items-center">
                <GripVertical className="w-5 h-5 text-muted-foreground shrink-0 cursor-grab" />

                {/* Thumbnail */}
                <div className="w-20 h-12 rounded-md overflow-hidden bg-muted border shrink-0">
                  {banner.mediaType === "VIDEO" ? (
                    <video src={banner.imageUrl} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner.imageUrl} alt="banner" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{banner.title || <span className="text-muted-foreground italic">Untitled</span>}</p>
                  {banner.subtitle && <p className="text-sm text-muted-foreground truncate">{banner.subtitle}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Order: {banner.sortOrder}</span>
                    <span className="flex items-center gap-1">
                      {banner.mediaType === "VIDEO" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {banner.mediaType || "IMAGE"}
                    </span>
                    {banner.ctaText && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {banner.ctaText}
                      </span>
                    )}
                    {banner.startDate && <span>From {formatDate(banner.startDate)}</span>}
                    {banner.endDate && <span>Until {formatDate(banner.endDate)}</span>}
                    {banner.archivedAt && <span>Archived {formatDate(banner.archivedAt)}</span>}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={banner.archivedAt ? "outline" : banner.isActive ? "default" : "secondary"} className={banner.isActive && !banner.archivedAt ? "bg-green-600" : ""}>
                    {banner.archivedAt ? "Archived" : banner.isActive ? "Live" : "Hidden"}
                  </Badge>
                  <Switch
                    checked={banner.isActive && !banner.archivedAt}
                    onCheckedChange={v => toggleMutation.mutate({ id: banner.id, data: { isActive: v } })}
                    disabled={!!banner.archivedAt}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                    if (confirm("Delete this banner?")) deleteMutation.mutate(banner.id)
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: banner.id, data: { isActive: false, archivedAt: new Date().toISOString() } })}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Media URL <span className="text-destructive">*</span></Label>
              <Input
                placeholder="https://… image or video URL"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadMutation.mutate(file)
                  }}
                />
                <Button variant="outline" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
              {formData.imageUrl && (
                <div className="w-full h-28 rounded-md overflow-hidden bg-muted border">
                  {formData.mediaType === "VIDEO" ? (
                    <video src={formData.imageUrl} className="w-full h-full object-cover" controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Book a nanny today" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input placeholder="e.g. Trusted care at your doorstep" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input placeholder="e.g. Browse Workers" value={formData.ctaText} onChange={e => setFormData({ ...formData, ctaText: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input placeholder="e.g. /service" value={formData.ctaLink} onChange={e => setFormData({ ...formData, ctaLink: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" min={0} value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={v => setFormData({ ...formData, isActive: v })} />
              <Label>Active (visible on home screen)</Label>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!formData.imageUrl.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
