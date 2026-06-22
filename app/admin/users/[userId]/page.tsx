"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { forceLogoutUser, unlockOtp } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import {
  ArrowLeft, Ban, ShieldCheck, Edit, Save, X, Loader2,
  User as UserIcon, Phone, Mail, Calendar, CheckCircle2,
  AlertCircle, Briefcase, Star, Activity,
  GraduationCap, FileText, Bell, Layers, Building2,
  Clock, ShieldAlert, ClipboardCheck,
  LogOut,
} from "lucide-react"

async function fetchUserDetail(id: string) {
  const res = await axiosInstance.get(`/admin/users/${id}`)
  return res.data?.data ?? res.data
}

function statusBadge(isBanned: boolean, isVerified: boolean) {
  if (isBanned) return <Badge variant="destructive">Banned</Badge>
  if (isVerified) return <Badge className="bg-green-600">Verified</Badge>
  return <Badge variant="secondary">Unverified</Badge>
}

function money(value: number) {
  return `${Math.round(value).toLocaleString()} RWF`
}

function compactDate(value?: string | null) {
  return value ? formatDate(value) : "—"
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  tone?: "default" | "good" | "warn" | "danger"
}) {
  const toneClass =
    tone === "good"
      ? "text-green-500"
      : tone === "warn"
        ? "text-yellow-500"
        : tone === "danger"
          ? "text-destructive"
          : "text-muted-foreground"

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-md border bg-muted/30 p-2">
          <Icon className={`h-4 w-4 ${toneClass}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      axiosInstance.patch(`/admin/users/${userId}/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Saved", description: "Profile updated." })
      setIsEditing(false)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Update failed.", variant: "destructive" })
    },
  })

  const banMutation = useMutation({
    mutationFn: () => axiosInstance.post(`/admin/users/${userId}/ban`, { reason: banReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "User suspended." })
      setIsBanDialogOpen(false)
      setBanReason("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Ban failed.", variant: "destructive" })
    },
  })

  const unbanMutation = useMutation({
    mutationFn: () => axiosInstance.post(`/admin/users/${userId}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Account restored." })
    },
  })

  const unlockOtpMutation = useMutation({
    mutationFn: () => unlockOtp(user.phoneNumber),
    onSuccess: () => {
      toast({ title: "OTP unlocked", description: "The user can request or enter OTP again." })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not unlock OTP.", variant: "destructive" })
    },
  })

  const forceLogoutMutation = useMutation({
    mutationFn: () => forceLogoutUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      toast({ title: "User logged out", description: "All existing sessions for this user were invalidated." })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not log out user.", variant: "destructive" })
    },
  })

  const startEdit = () => {
    setEditData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      bio: user?.bio || "",
    })
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load user.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed User"
  const roles = Array.isArray(user.roles) ? user.roles : []
  const isWorker = roles.includes("WORKER")
  const isEmployer = roles.some((role: string) => ["EMPLOYER", "COMPANY", "STAFFING_AGENCY"].includes(role))
  const allBookings = [
    ...(user.bookingsAsWorker ?? []),
    ...(user.bookingsAsEmployer ?? []),
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15)
  const employerBookings = user.bookingsAsEmployer ?? []
  const workerBookings = user.bookingsAsWorker ?? []
  const relevantBookings = isEmployer && !isWorker ? employerBookings : isWorker && !isEmployer ? workerBookings : allBookings
  const completedBookings = relevantBookings.filter((booking: any) => booking.status === "COMPLETED").length
  const cancelledBookings = relevantBookings.filter((booking: any) => booking.status === "CANCELLED").length
  const activeBookings = relevantBookings.filter((booking: any) => ["CONFIRMED", "IN_PROGRESS", "PENDING"].includes(booking.status)).length
  const totalSpend = employerBookings.reduce((sum: number, booking: any) => sum + (Number(booking.agreedPrice) || 0), 0)
  // The platform uses a would-rehire signal, not numeric ratings.
  const rehireAnswered = (user.reviewsReceived ?? []).filter((review: any) => review.wouldRehire)
  const rehireYes = rehireAnswered.filter((review: any) => review.wouldRehire === "YES").length
  const rehireRate = rehireAnswered.length
    ? `${Math.round((rehireYes / rehireAnswered.length) * 100)}%`
    : "—"
  const reportsFiled = user.reportsFiled?.length ?? 0
  const reportsReceived = user.reportsReceived?.length ?? 0
  const allReports = [
    ...(user.reportsReceived ?? []).map((report: any) => ({ ...report, direction: "Against user" })),
    ...(user.reportsFiled ?? []).map((report: any) => ({ ...report, direction: "Filed by user" })),
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const openReports = [...(user.reportsFiled ?? []), ...(user.reportsReceived ?? [])].filter((report: any) =>
    ["PENDING", "REVIEWING"].includes(report.status),
  ).length
  const latestVerification = user.verificationRequests?.[0]
  const recentAudit = user.auditHistory?.slice(0, 3) ?? []
  const lastActiveAt = user.lastActiveAt || user.lastSeenAt || null

  const roleStats = isWorker
    ? [
        ["Active services", user.services?.filter((service: any) => service.isActive).length ?? 0],
        ["Completed work", completedBookings],
        ["Would-rehire rate", rehireRate],
        ["Reports received", reportsReceived],
      ]
    : [
        ["Bookings created", employerBookings.length],
        ["Completed bookings", completedBookings],
        ["Cancelled bookings", cancelledBookings],
        ["Estimated spend", money(totalSpend)],
      ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {user.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={fullName} 
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center border-2 border-white shadow-md">
            <UserIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold leading-tight">{fullName}</h1>
          <p className="text-sm text-muted-foreground">@{user.username || "no_handle"} · {user.id.slice(0, 8)}…</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(user.isBanned, user.isVerified)}
          {user.roles?.map((r: string) => (
            <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {!isEditing ? (
            <Button variant="outline" onClick={startEdit}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            </>
          )}
          {user.isBanned ? (
            <Button variant="outline" className="text-green-600 border-green-600" onClick={() => unbanMutation.mutate()} disabled={unbanMutation.isPending}>
              <ShieldCheck className="w-4 h-4 mr-2" /> Unban
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setIsBanDialogOpen(true)}>
              <Ban className="w-4 h-4 mr-2" /> Ban
            </Button>
          )}
          <Button variant="outline" onClick={() => unlockOtpMutation.mutate()} disabled={unlockOtpMutation.isPending}>
            {unlockOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Unlock OTP
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm(`Log out ${fullName} from all devices?`)) {
                forceLogoutMutation.mutate()
              }
            }}
            disabled={forceLogoutMutation.isPending}
          >
            {forceLogoutMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Log out
          </Button>
        </div>
      </div>

      {/* Ban banner */}
      {user.isBanned && user.banReason && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-destructive text-sm">Account Suspended</p>
            <p className="text-sm text-muted-foreground mt-0.5">{user.banReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={user.isBanned ? Ban : ShieldCheck}
          label="Account state"
          value={user.isBanned ? "Banned" : user.deletedAt ? "Deleted" : "Active"}
          tone={user.isBanned || user.deletedAt ? "danger" : "good"}
        />
        <StatTile
          icon={Briefcase}
          label={isWorker ? "Work activity" : "Employer activity"}
          value={`${activeBookings} active · ${completedBookings} completed`}
          tone={activeBookings > 0 ? "good" : "default"}
        />
        <StatTile
          icon={openReports > 0 ? ShieldAlert : ClipboardCheck}
          label="Trust & safety"
          value={`${openReports} open · ${reportsReceived} against`}
          tone={openReports > 0 ? "danger" : "good"}
        />
        <StatTile
          icon={Clock}
          label="Last active"
          value={lastActiveAt ? compactDate(lastActiveAt) : "Not tracked yet"}
          tone="default"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={user.isMobileVerified ? "default" : "secondary"}>
          Mobile {user.isMobileVerified ? "verified" : "not verified"}
        </Badge>
        <Badge variant={user.governmentIdStatus === "APPROVED" ? "default" : user.governmentIdStatus === "REJECTED" ? "destructive" : "secondary"}>
          Gov ID {user.governmentIdStatus || "unknown"}
        </Badge>
        {roles.includes("EMPLOYER") && (
          <Badge variant={user.employerOnboardingComplete ? "default" : "outline"}>
            Employer onboarding {user.employerOnboardingComplete ? "complete" : "incomplete"}
          </Badge>
        )}
        {roles.includes("WORKER") && (
          <Badge variant={user.workerOnboardingComplete ? "default" : "outline"}>
            Worker onboarding {user.workerOnboardingComplete ? "complete" : "incomplete"}
          </Badge>
        )}
        <Badge variant={reportsFiled || reportsReceived ? "secondary" : "outline"}>
          {reportsFiled} filed · {reportsReceived} received reports
        </Badge>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><UserIcon className="w-4 h-4 mr-1.5" />Profile</TabsTrigger>
          <TabsTrigger value="services"><Layers className="w-4 h-4 mr-1.5" />Services ({user.services?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="bookings"><Briefcase className="w-4 h-4 mr-1.5" />Bookings ({allBookings.length})</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-1.5" />Reviews ({user.reviewsReceived?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="reports"><AlertCircle className="w-4 h-4 mr-1.5" />Reports ({allReports.length})</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-1.5" />Docs ({user.documents?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="history"><Activity className="w-4 h-4 mr-1.5" />Admin Log</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm">Profile Summary</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {user.bio || "No bio provided."}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Gender", user.gender],
                    ["Date of Birth", user.dateOfBirth ? compactDate(user.dateOfBirth) : null],
                    ["Languages", user.languages?.join(", ")],
                    ["Experience", user.yearsOfExperience ? `${user.yearsOfExperience} yrs` : null],
                    ["Education", user.educationLevel],
                    ["Preferred Work Time", user.preferredWorkTime],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p>{val || "—"}</p>
                    </div>
                  ))}
                </div>
                {user.profileImages && user.profileImages.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs text-muted-foreground uppercase">Profile Gallery</Label>
                    <div className="flex flex-wrap gap-2">
                      {user.profileImages.map((img: string, i: number) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="block shrink-0">
                          <img 
                            src={img} 
                            alt={`Profile ${i+1}`} 
                            className="w-20 h-20 rounded-lg object-cover border hover:opacity-80 transition-opacity" 
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {isWorker ? "Worker Summary" : "Employer Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {roleStats.map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{user.phoneNumber}</span>
                  {user.isMobileVerified && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{user.email || "—"}</span>
                  {user.isEmailVerified && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {formatDate(user.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4" />Education & Work</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Education</span><span>{user.educationLevel || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Work time</span><span>{user.preferredWorkTime || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Health</span><span>{user.healthStatus || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Qualities</span><span className="text-right">{user.topQualities?.join(", ") || "—"}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Verification</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Mobile</span><span>{user.isMobileVerified ? "Verified" : "Not verified"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user.isEmailVerified ? "Verified" : "Not verified"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gov ID</span><span>{user.governmentIdStatus || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span>{user.documents?.length ?? 0}</span></div>
                {latestVerification && (
                  <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                    <Link href={`/admin/verifications/${latestVerification.id}`}>
                      Open latest verification
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4" />Organization</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Owned org</span><span className="text-right">{user.ownedOrg?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Agency</span><span className="text-right">{user.agency?.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registered by</span><span>{user.registeredById ? user.registeredById.slice(0, 8) : "Self"}</span></div>
              </CardContent>
            </Card>
          </div>

          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} rows={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> Recent Admin Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!recentAudit.length ? (
                <p className="text-sm text-muted-foreground">No admin actions recorded.</p>
              ) : recentAudit.map((log: any) => (
                <div key={log.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-primary">{log.action}</span>
                    <span className="text-xs text-muted-foreground">{compactDate(log.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {[log.actor?.firstName, log.actor?.lastName].filter(Boolean).join(" ") || "Unknown admin"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {user.addresses?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Addresses</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {user.addresses.map((addr: any) => (
                  <div key={addr.id} className="text-sm flex gap-2 items-center">
                    {addr.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                    <span>{[addr.street, addr.sector, addr.district, addr.city].filter(Boolean).join(", ")}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {!user.services?.length ? (
                <p className="text-center text-muted-foreground py-10">No service listings.</p>
              ) : (
                <div className="divide-y">
                  {user.services.map((service: any) => (
                    <div key={service.id} className="p-4 text-sm flex gap-4">
                      {service.serviceImage ? (
                        <img 
                          src={service.serviceImage} 
                          alt={service.title} 
                          className="w-20 h-20 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border shrink-0">
                          <Layers className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{service.title}</p>
                            <p className="text-xs text-muted-foreground">{service.category?.name} · {formatDate(service.createdAt)}</p>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"}>{service.isActive ? "Active" : "Hidden"}</Badge>
                        </div>
                        <p className="mt-2 text-muted-foreground line-clamp-2">{service.description}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>{service._count?.bookings ?? 0} bookings</span>
                          <span>{service._count?.reviews ?? 0} reviews</span>
                          <span>{service._count?.bookmarks ?? 0} saved</span>
                          <span className="font-bold text-primary">{service.priceMin ?? "—"} - {service.priceMax ?? "—"} RWF {service.priceType ? `(${service.priceType})` : ""}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings */}
        <TabsContent value="bookings" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {allBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No bookings.</p>
              ) : (
                <div className="divide-y">
                  {allBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-medium">{b.service?.title || b.job?.title || "Direct booking"}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.employer ? `Employer: ${b.employer.firstName} ${b.employer.lastName}` : ""}
                          {b.worker ? `Worker: ${b.worker.firstName} ${b.worker.lastName}` : ""}
                          {" · "}{formatDate(b.createdAt)}
                        </p>
                      </div>
                      <Badge variant={b.status === "COMPLETED" ? "default" : b.status === "CANCELLED" ? "destructive" : "secondary"}>
                        {b.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {!user.reviewsReceived?.length ? (
                <p className="text-center text-muted-foreground py-10">No reviews received.</p>
              ) : (
                <div className="divide-y">
                  {user.reviewsReceived.map((r: any) => (
                    <div key={r.id} className="p-4 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.wouldRehire === "YES"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : r.wouldRehire === "MAYBE"
                                ? "bg-amber-500/10 text-amber-600"
                                : r.wouldRehire === "NO"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {r.wouldRehire === "YES"
                            ? "Would rehire"
                            : r.wouldRehire === "MAYBE"
                              ? "Maybe"
                              : r.wouldRehire === "NO"
                                ? "Would not rehire"
                                : "No signal"}
                        </span>
                        <span className="text-muted-foreground text-xs">by {r.author?.firstName} {r.author?.lastName}</span>
                        <span className="text-muted-foreground text-xs ml-auto">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
                      {r.reply && (
                        <div className="mt-3 rounded-md border bg-muted/40 p-3">
                          <p className="text-xs font-semibold">Public reply</p>
                          <p className="mt-1 text-muted-foreground">{r.reply}</p>
                          {r.repliedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Replied {formatDate(r.repliedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {!allReports.length ? (
                <p className="text-center text-muted-foreground py-10">No reports filed or received.</p>
              ) : (
                <div className="divide-y">
                  {allReports.map((r: any) => (
                    <div key={r.id} className="p-4 text-sm space-y-1">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">{r.reason}</span>
                          <p className="text-xs text-muted-foreground">{r.direction}</p>
                        </div>
                        <Badge variant={r.status === "RESOLVED" ? "default" : r.status === "DISMISSED" ? "secondary" : "destructive"}>
                          {r.status}
                        </Badge>
                      </div>
                      {r.description && <p className="text-muted-foreground">{r.description}</p>}
                      <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Documents</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!user.documents?.length ? (
                  <p className="text-sm text-muted-foreground">No documents uploaded.</p>
                ) : user.documents.map((doc: any) => (
                  <div key={doc.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{doc.type}</span>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.documentFileName}</p>
                    {doc.documentUrl && (
                      <Button variant="link" className="h-auto p-0 text-xs" asChild>
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer">Open document</a>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4" />Recent Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {!user.notifications?.length ? (
                  <p className="text-sm text-muted-foreground">No recent notifications.</p>
                ) : user.notifications.slice(0, 8).map((notification: any) => (
                  <div key={notification.id} className="rounded-md border p-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{notification.title}</p>
                      <Badge variant={notification.status === "READ" ? "secondary" : "outline"}>{notification.status}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{notification.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin log */}
        <TabsContent value="history" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {!user.auditHistory?.length ? (
                <p className="text-center text-muted-foreground py-10">No admin actions recorded.</p>
              ) : (
                <div className="divide-y">
                  {user.auditHistory.map((log: any) => (
                    <div key={log.id} className="p-4 flex items-start gap-3 text-sm">
                      <div className="p-2 rounded-full bg-muted shrink-0">
                        <Activity className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-primary">{log.action}</p>
                        <p className="text-muted-foreground text-xs">
                          by {log.actor?.firstName} {log.actor?.lastName} · {formatDate(log.createdAt)}
                        </p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                            {JSON.stringify(log.metadata)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ban dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This immediately prevents them from logging in or using the platform.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g. Multiple harassment reports…"
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => banMutation.mutate()}
            >
              {banMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
