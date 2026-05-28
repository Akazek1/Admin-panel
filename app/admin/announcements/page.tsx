"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Loader2, Plus, Send, Trash2, Megaphone, Users, Briefcase, Globe } from "lucide-react"

interface Announcement {
  id: string
  title: string
  body: string
  audience: "ALL" | "WORKERS" | "EMPLOYERS" | "CUSTOM"
  targetRoles?: string[]
  targetLocations?: string[]
  targetCategories?: string[]
  targetEducationLevels?: string[]
  sentAt: string | null
  scheduledAt: string | null
  expiresAt: string | null
  createdAt: string
}

const audienceIcon = (audience: string) => {
  if (audience === "WORKERS") return <Briefcase className="w-3 h-3" />
  if (audience === "EMPLOYERS") return <Users className="w-3 h-3" />
  return <Globe className="w-3 h-3" />
}

const audienceLabel = (audience: string) => {
  if (audience === "WORKERS") return "Workers only"
  if (audience === "EMPLOYERS") return "Employers only"
  if (audience === "CUSTOM") return "Custom segment"
  return "Everyone"
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audience: "ALL" as "ALL" | "WORKERS" | "EMPLOYERS" | "CUSTOM",
    targetRoles: "",
    targetLocations: "",
    targetCategories: "",
    targetEducationLevels: "",
    expiresAt: "",
  })

  const { data: categories } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["admin-categories-for-announcements"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/categories")
      const result = res.data?.data ?? res.data
      return Array.isArray(result) ? result : (result?.data ?? [])
    },
  })

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/announcements")
      return res.data?.data ?? res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      axiosInstance.post("/admin/announcements", {
        ...data,
        audience: data.audience,
        targetRoles: data.targetRoles.split(",").map((v) => v.trim()).filter(Boolean),
        targetLocations: data.targetLocations.split(",").map((v) => v.trim()).filter(Boolean),
        targetCategories: data.targetCategories.split(",").map((v) => v.trim()).filter(Boolean),
        targetEducationLevels: data.targetEducationLevels.split(",").map((v) => v.trim()).filter(Boolean),
        expiresAt: data.expiresAt || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] })
      toast({ title: "Created", description: "Announcement saved. Hit Send to deliver it." })
      setIsDialogOpen(false)
      setFormData({ title: "", body: "", audience: "ALL", targetRoles: "", targetLocations: "", targetCategories: "", targetEducationLevels: "", expiresAt: "" })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create.", variant: "destructive" })
    },
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.post(`/admin/announcements/${id}/send`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] })
      toast({ title: "Sent!", description: "Notification delivered to all recipients." })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Send failed.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] })
      toast({ title: "Deleted" })
    },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-1">Broadcast messages to your platform users via push notification.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !announcements?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No announcements yet</p>
              <p className="text-sm text-muted-foreground">Create one to broadcast a message to your users.</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Announcement</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className={a.sentAt ? "opacity-75" : ""}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 shrink-0">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {a.sentAt ? (
                        <Badge className="bg-green-600 gap-1">
                          <Send className="w-3 h-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      <Badge variant="outline" className="gap-1 text-xs">
                        {audienceIcon(a.audience)} {audienceLabel(a.audience)}
                      </Badge>
                    </div>
                  </div>
                  {(a.targetRoles?.length || a.targetLocations?.length || a.targetCategories?.length || a.targetEducationLevels?.length) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {a.targetRoles?.length ? <Badge variant="secondary">Roles: {a.targetRoles.join(", ")}</Badge> : null}
                      {a.targetLocations?.length ? <Badge variant="secondary">Locations: {a.targetLocations.join(", ")}</Badge> : null}
                      {a.targetCategories?.length ? <Badge variant="secondary">Categories: {a.targetCategories.length}</Badge> : null}
                      {a.targetEducationLevels?.length ? <Badge variant="secondary">Education: {a.targetEducationLevels.join(", ")}</Badge> : null}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-muted-foreground">
                      Created {formatDate(a.createdAt)}
                    </span>
                    {a.sentAt && (
                      <span className="text-xs text-muted-foreground">
                        Sent {formatDate(a.sentAt)}
                      </span>
                    )}
                    <div className="flex gap-2 ml-auto">
                      {!a.sentAt && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (confirm(`Send "${a.title}" to ${audienceLabel(a.audience)}?`)) {
                              sendMutation.mutate(a.id)
                            }
                          }}
                          disabled={sendMutation.isPending}
                        >
                          {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                          Send Now
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Delete this announcement?")) deleteMutation.mutate(a.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Platform maintenance tonight at 10pm"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here…"
                rows={4}
                value={formData.body}
                onChange={e => setFormData({ ...formData, body: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={formData.audience} onValueChange={v => setFormData({ ...formData, audience: v as typeof formData.audience })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Everyone</SelectItem>
                    <SelectItem value="WORKERS">Workers only</SelectItem>
                    <SelectItem value="EMPLOYERS">Employers only</SelectItem>
                    <SelectItem value="CUSTOM">Custom segment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expires (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
            </div>
            {formData.audience === "CUSTOM" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <Input placeholder="WORKER, EMPLOYER" value={formData.targetRoles} onChange={e => setFormData({ ...formData, targetRoles: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Locations</Label>
                    <Input placeholder="Kigali, Gasabo, Remera" value={formData.targetLocations} onChange={e => setFormData({ ...formData, targetLocations: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category IDs</Label>
                    <Input
                      placeholder={(categories ?? []).slice(0, 2).map((c) => c.name).join(", ") || "Category IDs"}
                      value={formData.targetCategories}
                      onChange={e => setFormData({ ...formData, targetCategories: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(categories ?? []).slice(0, 4).map((c) => `${c.name}: ${c.id.slice(0, 6)}...`).join(" · ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Levels</Label>
                    <Input placeholder="PRIMARY, HIGH_SCHOOL, UNIVERSITY" value={formData.targetEducationLevels} onChange={e => setFormData({ ...formData, targetEducationLevels: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!formData.title.trim() || !formData.body.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate(formData)}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save as Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
