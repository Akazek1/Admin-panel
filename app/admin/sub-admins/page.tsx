"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { getAllUsers, User } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { Loader2, Plus, Edit, Trash2, ShieldCheck, UserCog, Search } from "lucide-react"

// All permission flags currently in AdminPermission model
const ALL_PERMISSIONS: { key: string; label: string; description: string }[] = [
  { key: "canVerifyUsers",      label: "Verify Users",       description: "Approve/reject ID verification requests" },
  { key: "canModerateReports",  label: "Moderate Reports",   description: "Review and resolve user reports" },
  { key: "canManageUsers",      label: "Manage Users",       description: "Edit profiles, ban/unban, create sub-admins" },
  { key: "canManageBookings",   label: "Manage Bookings",    description: "View and update booking status, monitor conversations" },
  { key: "canViewAnalytics",    label: "View Analytics",     description: "Access dashboard stats and service listings" },
  { key: "canManageCategories", label: "Manage Categories",  description: "Create, edit, delete categories and banners" },
  { key: "canViewAuditLogs",    label: "View Audit Logs",    description: "Read admin action history" },
  { key: "canModerateReviews",  label: "Moderate Reviews",   description: "Delete inappropriate reviews" },
]

type AdminPermissions = Record<string, boolean>

interface SubAdmin {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  email: string | null
  isActive: boolean
  isBanned: boolean
  createdAt: string
  adminPermissions: (AdminPermissions & { id: string; userId: string }) | null
}

const emptyPermissions = (): AdminPermissions =>
  Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, false]))

const permissionPresets = [
  {
    name: "Trust & Safety",
    description: "Verifications, reports, reviews, and audit context.",
    permissions: ["canVerifyUsers", "canModerateReports", "canModerateReviews", "canViewAuditLogs"],
  },
  {
    name: "Marketplace Ops",
    description: "Bookings, services, conversations, and analytics.",
    permissions: ["canManageBookings", "canViewAnalytics"],
  },
  {
    name: "Content Manager",
    description: "Categories, banners, and content configuration.",
    permissions: ["canManageCategories", "canViewAnalytics"],
  },
  {
    name: "Support Lead",
    description: "User support, bookings, reports, and reviews.",
    permissions: ["canManageUsers", "canManageBookings", "canModerateReports", "canModerateReviews"],
  },
  {
    name: "Read-only Analyst",
    description: "Dashboard and audit visibility only.",
    permissions: ["canViewAnalytics", "canViewAuditLogs"],
  },
]

export default function SubAdminsPage() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SubAdmin | null>(null)
  const [permissions, setPermissions] = useState<AdminPermissions>(emptyPermissions())
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const { data: subAdmins, isLoading } = useQuery<SubAdmin[]>({
    queryKey: ["admin-sub-admins"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/sub-admins")
      return res.data?.data ?? res.data
    },
  })

  const { data: users } = useQuery<User[]>({
    queryKey: ["admin-users-for-sub-admins"],
    queryFn: getAllUsers,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      axiosInstance.post("/admin/sub-admins", { userId: selectedUserId, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-admins"] })
      toast({ title: "Sub-admin created", description: "User elevated and permissions assigned." })
      setIsCreateOpen(false)
      setSelectedUserId("")
      setPermissions(emptyPermissions())
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create sub-admin.", variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      axiosInstance.patch(`/admin/sub-admins/${editTarget!.id}/permissions`, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-admins"] })
      toast({ title: "Permissions updated." })
      setEditTarget(null)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Update failed.", variant: "destructive" })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/sub-admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sub-admins"] })
      toast({ title: "Sub-admin removed." })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Remove failed.", variant: "destructive" })
    },
  })

  const openEdit = (sa: SubAdmin) => {
    const perms = { ...emptyPermissions() }
    if (sa.adminPermissions) {
      ALL_PERMISSIONS.forEach(p => {
        perms[p.key] = !!(sa.adminPermissions as any)[p.key]
      })
    }
    setPermissions(perms)
    setEditTarget(sa)
  }

  const openCreate = () => {
    setPermissions(emptyPermissions())
    setSelectedUserId("")
    setIsCreateOpen(true)
  }

  const toggleAll = (value: boolean) => {
    setPermissions(Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, value])))
  }

  const applyPreset = (keys: string[]) => {
    setPermissions(Object.fromEntries(ALL_PERMISSIONS.map(p => [p.key, keys.includes(p.key)])))
  }

  const filteredSubAdmins = (subAdmins ?? []).filter((sa) => {
    const searchStr = `${sa.firstName || ""} ${sa.lastName || ""} ${sa.phoneNumber} ${sa.email || ""}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })

  const eligibleUsers = (users ?? []).filter((user) => !user.roles.includes("SUB_ADMIN") && !user.roles.includes("ADMIN"))

  const PermissionGrid = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center pb-1">
        <p className="text-sm font-medium">Permission flags</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => toggleAll(true)}>All on</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => toggleAll(false)}>All off</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {permissionPresets.map((preset) => (
          <Button
            key={preset.name}
            type="button"
            variant="outline"
            className="h-auto justify-start px-3 py-2 text-left"
            onClick={() => applyPreset(preset.permissions)}
          >
            <span>
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{preset.description}</span>
            </span>
          </Button>
        ))}
      </div>
      {ALL_PERMISSIONS.map(p => (
        <div key={p.key} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
          <Switch
            checked={!!permissions[p.key]}
            onCheckedChange={v => setPermissions(prev => ({ ...prev, [p.key]: v }))}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">{p.label}</p>
            <p className="text-xs text-muted-foreground">{p.description}</p>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Sub-admins</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Elevate users to sub-admin and control exactly what they can do.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sub-admins..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add Sub-admin
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {filteredSubAdmins.length} shown · {selectedIds.length} selected
        </p>
        <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
          Review Selected
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !filteredSubAdmins.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="p-4 bg-muted rounded-full"><UserCog className="w-8 h-8 text-muted-foreground" /></div>
            <div>
              <p className="font-semibold">No sub-admins yet</p>
              <p className="text-sm text-muted-foreground">Promote a user to give them scoped admin access.</p>
            </div>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Sub-admin</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubAdmins.map(sa => {
            const activeCount = sa.adminPermissions
              ? ALL_PERMISSIONS.filter(p => !!(sa.adminPermissions as any)[p.key]).length
              : 0
            return (
              <Card key={sa.id}>
                <CardContent className="p-5 flex items-center gap-4">
                  <Checkbox
                    checked={selectedIds.includes(sa.id)}
                    onCheckedChange={(value) =>
                      setSelectedIds((prev) =>
                        value ? Array.from(new Set([...prev, sa.id])) : prev.filter((id) => id !== sa.id)
                      )
                    }
                    aria-label={`Select ${sa.firstName || sa.phoneNumber}`}
                  />
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                    {[sa.firstName, sa.lastName].filter(Boolean).map(s => s![0]).join("") || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      {[sa.firstName, sa.lastName].filter(Boolean).join(" ") || "Unnamed"}
                    </p>
                    <p className="text-sm text-muted-foreground">{sa.phoneNumber} · {sa.email || "no email"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Added {formatDate(sa.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {activeCount} / {ALL_PERMISSIONS.length} permissions
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(sa)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Remove sub-admin role from ${sa.firstName}?`)) {
                          removeMutation.mutate(sa.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Sub-admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing user" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.phoneNumber} · {user.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pick a normal user, then apply a preset or custom permissions.
              </p>
            </div>
            <PermissionGrid />
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedUserId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Sub-admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit permissions dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions — {[editTarget?.firstName, editTarget?.lastName].filter(Boolean).join(" ")}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <PermissionGrid />
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
