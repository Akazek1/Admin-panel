"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { forceLogoutUser, unlockOtp, deleteUser, setUserPin, changeUserPhone, uploadImage, updateUserProfile, uploadUserDocument, getTaxonomyTree, createUserService } from "@/lib/api"
import { Switch } from "@/components/ui/switch"
import { ImageUploadButton } from "@/components/image-upload-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { ImageLightbox } from "@/components/image-lightbox"
import { CopyableText } from "@/components/admin/copyable-text"
import { formatDate } from "@/lib/utils"
import {
  ArrowLeft, Ban, ShieldCheck, Edit, Save, X, Loader2,
  User as UserIcon, Phone, Mail, Calendar, CheckCircle2,
  AlertCircle, Briefcase, Star, Activity,
  GraduationCap, FileText, Bell, Layers, Building2,
  Clock, ShieldAlert, ClipboardCheck,
  LogOut, Trash2, ChevronRight,
} from "lucide-react"

async function fetchUserDetail(id: string) {
  const res = await axiosInstance.get(`/admin/users/${id}`)
  return res.data?.data ?? res.data
}

// These option lists mirror the real user app's "Edit profile" screen exactly,
// so an admin editing on someone's behalf makes the same choices the user would.
const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
]
const LANGUAGE_OPTIONS = ["Kinyarwanda", "English", "French", "Swahili"]
const EDUCATION_OPTIONS = [
  "No formal education", "Primary school", "Lower secondary",
  "Upper secondary / high school", "Vocational / TVET", "University", "Other",
]
const WORK_TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Full day", "Live-in", "Flexible"]
const HEALTH_OPTIONS = ["Fit for work", "Can do light work", "Prefer not to say"]
const QUALITY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "RELIABLE", label: "Reliable & Trustworthy" },
  { key: "ATTENTION_TO_DETAIL", label: "Attention to Detail" },
  { key: "ON_TIME", label: "On Time" },
  { key: "EXPERIENCED", label: "Experienced" },
  { key: "INSURED", label: "Insured" },
  { key: "MULTILINGUAL", label: "Multilingual" },
  { key: "ECO_FRIENDLY", label: "Eco-Friendly" },
  { key: "PET_FRIENDLY", label: "Pet-Friendly" },
]
const MAX_QUALITIES = 3
const BIO_LIMIT = 500

// Service creation on a user's behalf — mirrors the app's "Add a service" wizard.
const SERVICE_CHARGED_PER = [
  { value: "one_time", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]
const MAX_NEW_SERVICE_PHOTOS = 5
const SERVICE_DESCRIPTION_LIMIT = 150

// ISO / date → the YYYY-MM-DD an <input type="date"> expects.
function toDateInput(value?: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

const AUDIT_FIELD_LABELS: Record<string, string> = {
  firstName: "First name", lastName: "Last name", username: "Username", email: "Email",
  dateOfBirth: "Date of birth", gender: "Gender", languages: "Languages", bio: "Bio",
  educationLevel: "Education", healthStatus: "Health status", preferredWorkTime: "Work time",
  topQualities: "Top qualities", yearsOfExperience: "Experience",
  profilePicture: "Profile picture", profileImages: "Gallery",
}

function formatAuditValue(v: any) {
  if (v === null || v === undefined || v === "") return "—"
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—"
  const s = String(v)
  return s.length > 48 ? `${s.slice(0, 48)}…` : s
}

// Render audit metadata readably: a field-level "before → after" diff when the
// action recorded one, otherwise the raw JSON as a fallback.
function AuditMeta({ metadata }: { metadata: any }) {
  const changes = metadata?.changes
  if (changes && typeof changes === "object" && Object.keys(changes).length > 0) {
    return (
      <ul className="mt-1.5 space-y-1">
        {Object.entries(changes as Record<string, { from: any; to: any }>).map(([field, ch]) => (
          <li key={field} className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{AUDIT_FIELD_LABELS[field] ?? field}: </span>
            <span className="text-red-400/80 line-through">{formatAuditValue(ch.from)}</span>
            <span className="mx-1">→</span>
            <span className="text-emerald-400/90">{formatAuditValue(ch.to)}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (metadata && Object.keys(metadata).length > 0) {
    return <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{JSON.stringify(metadata)}</p>
  }
  return null
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
  const [editData, setEditData] = useState<{
    firstName: string
    lastName: string
    username: string
    email: string
    dateOfBirth: string
    gender: string
    languages: string[]
    bio: string
    educationLevel: string
    healthStatus: string
    preferredWorkTime: string
    topQualities: string[]
  }>({
    firstName: "", lastName: "", username: "", email: "", dateOfBirth: "", gender: "",
    languages: [], bio: "", educationLevel: "", healthStatus: "", preferredWorkTime: "", topQualities: [],
  })
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmPhone, setDeleteConfirmPhone] = useState("")
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false)
  const [assignPin, setAssignPin] = useState("")
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [newPhone, setNewPhone] = useState("")

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: () => fetchUserDetail(userId),
    enabled: !!userId,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
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

  const changePhoneMutation = useMutation({
    mutationFn: () => changeUserPhone(userId, newPhone.trim()),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Phone updated", description: `Number is now ${res?.phoneNumber ?? newPhone.trim()}.` })
      setIsPhoneDialogOpen(false)
      setNewPhone("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not change phone.", variant: "destructive" })
    },
  })

  const setPinMutation = useMutation({
    mutationFn: () => setUserPin(userId, assignPin.trim()),
    onSuccess: () => {
      toast({ title: "PIN set", description: "The user can log in with this PIN and will be asked to keep or change it." })
      setIsPinDialogOpen(false)
      setAssignPin("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not set PIN.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(userId, deleteConfirmPhone.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Account deleted." })
      setIsDeleteDialogOpen(false)
      router.push("/admin/users")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Delete failed.", variant: "destructive" })
    },
  })

  const startEdit = () => {
    setEditData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      dateOfBirth: toDateInput(user?.dateOfBirth),
      gender: user?.gender || "",
      languages: Array.isArray(user?.languages) ? user.languages : [],
      bio: user?.bio || "",
      educationLevel: user?.educationLevel || "",
      healthStatus: user?.healthStatus || "",
      preferredWorkTime: user?.preferredWorkTime || "",
      topQualities: Array.isArray(user?.topQualities) ? user.topQualities : [],
    })
    setIsEditing(true)
  }

  const toggleEditArray = (field: "languages" | "topQualities", value: string, max?: number) => {
    setEditData((prev) => {
      const current = prev[field]
      if (current.includes(value)) return { ...prev, [field]: current.filter((v) => v !== value) }
      if (max && current.length >= max) return prev
      return { ...prev, [field]: [...current, value] }
    })
  }

  const saveEdit = () => {
    updateMutation.mutate({
      firstName: editData.firstName.trim(),
      lastName: editData.lastName.trim(),
      username: editData.username.trim() || undefined,
      email: editData.email.trim() || undefined,
      gender: editData.gender || undefined,
      dateOfBirth: editData.dateOfBirth ? new Date(editData.dateOfBirth).toISOString() : undefined,
      languages: editData.languages,
      bio: editData.bio.trim(),
      educationLevel: editData.educationLevel || undefined,
      healthStatus: editData.healthStatus || undefined,
      preferredWorkTime: editData.preferredWorkTime || undefined,
      topQualities: editData.topQualities,
    })
  }

  // ── Add a service on the user's behalf ────────────────────────────────
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [svcForm, setSvcForm] = useState<{
    groupingId: string
    categoryId: string
    priceMode: "fixed" | "range"
    priceMin: string
    priceMax: string
    chargedPer: string
    negotiable: boolean
    description: string
    photos: string[]
  }>({ groupingId: "", categoryId: "", priceMode: "range", priceMin: "", priceMax: "", chargedPer: "daily", negotiable: false, description: "", photos: [] })
  const [svcPhotoBusy, setSvcPhotoBusy] = useState(false)
  const [svcSearch, setSvcSearch] = useState("")

  const { data: taxonomy = [] } = useQuery({
    queryKey: ["taxonomy-tree"],
    queryFn: getTaxonomyTree,
    enabled: isAddServiceOpen,
  })

  // Flat list of every job type with the grouping it lives under — powers search.
  const allJobTypes = taxonomy.flatMap((g: any) =>
    (g.jobTypes ?? []).map((jt: any) => ({ id: jt.id, name: jt.name, groupingId: g.id, groupingName: g.name })),
  )
  const searchResults = svcSearch.trim()
    ? allJobTypes.filter((jt: any) => jt.name.toLowerCase().includes(svcSearch.trim().toLowerCase())).slice(0, 30)
    : []
  const jobTypesInGrouping = svcForm.groupingId
    ? (taxonomy.find((g: any) => g.id === svcForm.groupingId)?.jobTypes ?? [])
    : []
  const selectedCategoryName = allJobTypes.find((jt: any) => jt.id === svcForm.categoryId)?.name

  const openAddService = () => {
    setSvcForm({ groupingId: "", categoryId: "", priceMode: "range", priceMin: "", priceMax: "", chargedPer: "daily", negotiable: false, description: "", photos: [] })
    setSvcSearch("")
    setIsAddServiceOpen(true)
  }

  const addServiceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createUserService(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-services"] })
      toast({ title: "Service added", description: "Listing created on the user's behalf." })
      setIsAddServiceOpen(false)
    },
    onError: (err: any) => {
      toast({ title: "Could not add service", description: err.response?.data?.message || "Creation failed.", variant: "destructive" })
    },
  })

  const submitAddService = () => {
    if (!svcForm.categoryId) {
      toast({ title: "Choose a service category", variant: "destructive" })
      return
    }
    const min = Number(svcForm.priceMin)
    if (!svcForm.priceMin.trim() || Number.isNaN(min) || min < 0) {
      toast({ title: "Enter a valid price", variant: "destructive" })
      return
    }
    let max = min
    if (svcForm.priceMode === "range") {
      max = Number(svcForm.priceMax)
      if (!svcForm.priceMax.trim() || Number.isNaN(max) || max < min) {
        toast({ title: "Maximum price must be greater than or equal to the minimum", variant: "destructive" })
        return
      }
    }
    addServiceMutation.mutate({
      categoryId: svcForm.categoryId,
      priceMin: min,
      priceMax: max,
      priceType: svcForm.chargedPer,
      negotiable: svcForm.negotiable,
      description: svcForm.description.trim().slice(0, SERVICE_DESCRIPTION_LIMIT) || undefined,
      serviceImages: svcForm.photos,
    })
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

  // Same gate the app enforces: a non-provider must have a profile picture and a
  // government ID (not rejected) before any service can be listed. We surface
  // this up front so an admin isn't surprised by the backend's rejection.
  const svcEligibilityIssues: string[] = (() => {
    if (user.isProvider || roles.includes("COMPANY")) return []
    const issues: string[] = []
    if (!user.profilePicture) issues.push("a profile picture")
    const gid = user.governmentIdStatus
    if (!gid || gid === "NONE") issues.push("a government ID")
    else if (gid === "REJECTED") issues.push("a valid government ID (the current one was rejected)")
    return issues
  })()
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
          <ImageLightbox
            src={user.profilePicture}
            alt={fullName}
            thumbClassName="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
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
              <Button onClick={saveEdit} disabled={updateMutation.isPending}>
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
          <Button
            variant="outline"
            onClick={() => { setNewPhone(user.phoneNumber || ""); setIsPhoneDialogOpen(true) }}
          >
            Change phone
          </Button>
          <Button
            variant="outline"
            onClick={() => { setAssignPin(""); setIsPinDialogOpen(true) }}
          >
            Set PIN
          </Button>
          <ImageUploadButton
            label={user.profilePicture ? "Change photo" : "Add photo"}
            onFile={async (file) => {
              const url = await uploadImage(file)
              await updateUserProfile(userId, { profilePicture: url })
              queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
              queryClient.invalidateQueries({ queryKey: ["admin-users"] })
              toast({ title: "Photo updated", description: "Profile picture saved on the user's behalf." })
            }}
          />
          <ImageUploadButton
            label="Upload ID"
            onFile={async (file) => {
              await uploadUserDocument(userId, file)
              queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] })
              toast({ title: "ID uploaded", description: "Submitted for verification on the user's behalf." })
            }}
          />
          <Button
            variant="outline"
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={() => { setDeleteConfirmPhone(""); setIsDeleteDialogOpen(true) }}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete
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
                        <div key={i} className="block shrink-0">
                          <ImageLightbox
                            src={img}
                            alt={`Profile ${i+1}`}
                            thumbClassName="w-20 h-20 rounded-lg object-cover border hover:opacity-80 transition-opacity"
                          />
                        </div>
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
                  <CopyableText value={user.phoneNumber} label="Phone number" className="font-mono" />
                  {user.isMobileVerified && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {user.email ? (
                    <CopyableText value={user.email} label="Email" className="font-mono" />
                  ) : (
                    <span className="font-mono">—</span>
                  )}
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
              <CardContent className="space-y-6">
                {/* Identity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={editData.lastName} onChange={e => setEditData({ ...editData, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} placeholder="username" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={editData.dateOfBirth} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={editData.gender} onValueChange={v => setEditData({ ...editData, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(lang => {
                      const active = editData.languages.includes(lang)
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleEditArray("languages", lang)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${active ? "border-green-600 bg-green-600/15 text-green-500" : "border-input bg-background hover:bg-muted"}`}
                        >
                          {lang}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Work & background */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Select value={editData.educationLevel} onValueChange={v => setEditData({ ...editData, educationLevel: v })}>
                      <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Work Time</Label>
                    <Select value={editData.preferredWorkTime} onValueChange={v => setEditData({ ...editData, preferredWorkTime: v })}>
                      <SelectTrigger><SelectValue placeholder="Select work time" /></SelectTrigger>
                      <SelectContent>
                        {WORK_TIME_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Health Status</Label>
                    <Select value={editData.healthStatus} onValueChange={v => setEditData({ ...editData, healthStatus: v })}>
                      <SelectTrigger><SelectValue placeholder="Select health status" /></SelectTrigger>
                      <SelectContent>
                        {HEALTH_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Top qualities (max 3) */}
                <div className="space-y-2">
                  <Label>Top Qualities <span className="text-xs text-muted-foreground">(choose up to {MAX_QUALITIES})</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {QUALITY_OPTIONS.map(q => {
                      const active = editData.topQualities.includes(q.key)
                      const atLimit = !active && editData.topQualities.length >= MAX_QUALITIES
                      return (
                        <button
                          key={q.key}
                          type="button"
                          disabled={atLimit}
                          onClick={() => toggleEditArray("topQualities", q.key, MAX_QUALITIES)}
                          className={`rounded-full border px-3 py-1 text-sm transition-colors ${active ? "border-green-600 bg-green-600/15 text-green-500" : atLimit ? "border-input bg-background opacity-40" : "border-input bg-background hover:bg-muted"}`}
                        >
                          {q.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={editData.bio} maxLength={BIO_LIMIT} onChange={e => setEditData({ ...editData, bio: e.target.value })} rows={3} />
                  <p className="text-right text-xs text-muted-foreground">{editData.bio.length}/{BIO_LIMIT}</p>
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
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-sm">Service Listings</CardTitle>
              <Button size="sm" onClick={openAddService}>
                <Layers className="w-4 h-4 mr-2" /> Add service
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!user.services?.length ? (
                <p className="text-center text-muted-foreground py-10">No service listings.</p>
              ) : (
                <div className="divide-y">
                  {user.services.map((service: any) => (
                    <div key={service.id} className="p-4 text-sm flex gap-4">
                      {service.serviceImage ? (
                        <ImageLightbox
                          src={service.serviceImage}
                          alt={service.category?.name}
                          thumbClassName="w-20 h-20 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border shrink-0">
                          <Layers className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <Link
                        href={`/admin/services?service=${service.id}`}
                        className="group flex-1 min-w-0 rounded-md -m-1 p-1 transition-colors hover:bg-muted/40"
                        title="Open to edit or delete"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium group-hover:underline">{service.category?.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(service.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={service.isActive ? "default" : "secondary"}>{service.isActive ? "Active" : "Hidden"}</Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                        <p className="mt-2 text-muted-foreground line-clamp-2">{service.description}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>{service._count?.bookings ?? 0} bookings</span>
                          <span>{service._count?.reviews ?? 0} reviews</span>
                          <span>{service._count?.bookmarks ?? 0} saved</span>
                          <span className="font-bold text-primary">{service.priceMin ?? "—"} - {service.priceMax ?? "—"} RWF {service.priceType ? `(${service.priceType})` : ""}</span>
                        </div>
                      </Link>
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
                        <p className="font-medium">{b.service?.category?.name || b.job?.title || "Direct booking"}</p>
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
                        <AuditMeta metadata={log.metadata} />
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
      {/* Add a service on the user's behalf — same fields as the app's wizard */}
      <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a service for {fullName}</DialogTitle>
          </DialogHeader>
          {svcEligibilityIssues.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">This user can’t list a service yet.</p>
                <p className="text-amber-200/80">
                  Like in the app, they first need {svcEligibilityIssues.join(" and ")}. Add {svcEligibilityIssues.length > 1 ? "them" : "it"} with the <span className="font-medium">Change photo</span>/<span className="font-medium">Upload ID</span> buttons above, then try again.
                </p>
              </div>
            </div>
          )}
          <div className="space-y-5 py-2">
            {/* Service picker: search by name, or browse grouping → service */}
            <div className="space-y-2">
              <Label>Service</Label>
              {svcForm.categoryId ? (
                <div className="flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <span><span className="text-muted-foreground">Selected: </span><span className="font-medium">{selectedCategoryName}</span></span>
                  <button type="button" className="text-xs text-green-500 hover:underline" onClick={() => setSvcForm({ ...svcForm, categoryId: "" })}>Change</button>
                </div>
              ) : (
                <>
                  <Input placeholder="Search a service by name…" value={svcSearch} onChange={e => setSvcSearch(e.target.value)} />
                  {svcSearch.trim() ? (
                    <div className="max-h-48 divide-y overflow-y-auto rounded-lg border border-input">
                      {searchResults.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-muted-foreground">No matching services.</p>
                      ) : searchResults.map((jt: any) => (
                        <button
                          key={jt.id}
                          type="button"
                          onClick={() => { setSvcForm(f => ({ ...f, categoryId: jt.id, groupingId: jt.groupingId })); setSvcSearch("") }}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span>{jt.name}</span>
                          <span className="text-xs text-muted-foreground">{jt.groupingName}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={svcForm.groupingId} onValueChange={v => setSvcForm({ ...svcForm, groupingId: v, categoryId: "" })}>
                        <SelectTrigger><SelectValue placeholder="Grouping" /></SelectTrigger>
                        <SelectContent>
                          {taxonomy.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={svcForm.categoryId} onValueChange={v => setSvcForm({ ...svcForm, categoryId: v })} disabled={!svcForm.groupingId}>
                        <SelectTrigger><SelectValue placeholder={svcForm.groupingId ? "Service" : "Pick grouping first"} /></SelectTrigger>
                        <SelectContent>
                          {jobTypesInGrouping.map((jt: any) => <SelectItem key={jt.id} value={jt.id}>{jt.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">Search by name, or pick a grouping then the service under it.</p>
                </>
              )}
            </div>

            {/* Price mode + inputs */}
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["fixed", "range"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSvcForm({ ...svcForm, priceMode: mode })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${svcForm.priceMode === mode ? "border-green-600 bg-green-600/15 text-green-500" : "border-input bg-background hover:bg-muted"}`}
                  >
                    {mode === "fixed" ? "Fixed price" : "Price range"}
                  </button>
                ))}
              </div>
              <div className={`grid gap-2 ${svcForm.priceMode === "range" ? "grid-cols-2" : ""}`}>
                <div>
                  <Label className="text-[11px] text-muted-foreground">{svcForm.priceMode === "fixed" ? "Price (RWF)" : "Minimum (RWF)"}</Label>
                  <Input inputMode="numeric" className="mt-1" value={svcForm.priceMin} placeholder="20000" onChange={e => setSvcForm({ ...svcForm, priceMin: e.target.value.replace(/[^\d]/g, "") })} />
                </div>
                {svcForm.priceMode === "range" && (
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Maximum (RWF)</Label>
                    <Input inputMode="numeric" className="mt-1" value={svcForm.priceMax} placeholder="40000" onChange={e => setSvcForm({ ...svcForm, priceMax: e.target.value.replace(/[^\d]/g, "") })} />
                  </div>
                )}
              </div>
            </div>

            {/* Billing period */}
            <div className="space-y-2">
              <Label>Billing period</Label>
              <div className="grid grid-cols-4 gap-2">
                {SERVICE_CHARGED_PER.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSvcForm({ ...svcForm, chargedPer: opt.value })}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${svcForm.chargedPer === opt.value ? "border-green-600 bg-green-600/15 text-green-500" : "border-input bg-background hover:bg-muted"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Negotiable */}
            <div className="flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
              <span>Open to negotiation</span>
              <Switch checked={svcForm.negotiable} onCheckedChange={v => setSvcForm({ ...svcForm, negotiable: v })} />
            </div>

            {/* Photos (optional) */}
            <div className="space-y-2">
              <Label>Photos <span className="text-xs text-muted-foreground">({svcForm.photos.length}/{MAX_NEW_SERVICE_PHOTOS}, optional)</span></Label>
              <div className="flex flex-wrap gap-2">
                {svcForm.photos.map((url, i) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                    <button
                      type="button"
                      onClick={() => setSvcForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {svcForm.photos.length < MAX_NEW_SERVICE_PHOTOS && (
                  <ImageUploadButton
                    label="Add photo"
                    variant="outline"
                    className="h-16"
                    disabled={svcPhotoBusy}
                    onFile={async (file) => {
                      setSvcPhotoBusy(true)
                      try {
                        const url = await uploadImage(file)
                        setSvcForm(f => ({ ...f, photos: [...f.photos, url].slice(0, MAX_NEW_SERVICE_PHOTOS) }))
                      } finally {
                        setSvcPhotoBusy(false)
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea value={svcForm.description} maxLength={SERVICE_DESCRIPTION_LIMIT} rows={3} placeholder="Tell clients about this service…" onChange={e => setSvcForm({ ...svcForm, description: e.target.value })} />
              <p className="text-right text-[11px] text-muted-foreground">{svcForm.description.length}/{SERVICE_DESCRIPTION_LIMIT}</p>
            </div>
          </div>
          {addServiceMutation.isError && (
            <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {(addServiceMutation.error as any)?.response?.data?.message || "Could not create the service."}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>Cancel</Button>
            <Button onClick={submitAddService} disabled={addServiceMutation.isPending || svcPhotoBusy}>
              {addServiceMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Change phone number (or set a placeholder like "seed-123" to free the old number). */}
      <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change phone number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Set a new number (e.g. <span className="font-mono">0788123456</span>) — it’s normalized to
              <span className="font-mono"> 250…</span>. Or set a placeholder like
              <span className="font-mono"> seed-{userId.slice(0, 6)}</span> to free the old number without deleting the account.
              A number already used by another account is rejected.
            </p>
            <div className="space-y-2">
              <Label>New phone / placeholder</Label>
              <Input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="250788123456 or seed-abc123"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhoneDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!newPhone.trim() || newPhone.trim() === user.phoneNumber || changePhoneMutation.isPending}
              onClick={() => changePhoneMutation.mutate()}
            >
              {changePhoneMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign a temporary PIN (assistance). The user keeps or changes it on next login. */}
      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a PIN for {fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Assign a 5-digit login PIN. It’s temporary — they’ll be asked to keep it
              or set their own the next time they log in. Share it with them securely.
            </p>
            <div className="space-y-2">
              <Label>PIN (5 digits)</Label>
              <Input
                inputMode="numeric"
                maxLength={5}
                placeholder="e.g. 48192"
                value={assignPin}
                onChange={e => setAssignPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPinDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={assignPin.trim().length !== 5 || setPinMutation.isPending}
              onClick={() => setPinMutation.mutate()}
            >
              {setPinMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Set PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete: guarded so it can't happen by mistake — the admin must type the
          account's exact phone number, and the button stays disabled until it
          matches. Accounts with shared activity are blocked server-side. */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently delete {fullName}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                This cannot be undone. Accounts with bookings, reviews or messages
                can’t be deleted (ban them instead) — deletion only works for
                accounts with no shared activity.
              </p>
            </div>
            <div className="space-y-2">
              <Label>
                Type the phone number <span className="font-mono font-semibold text-foreground">{user.phoneNumber}</span> to confirm
              </Label>
              <Input
                placeholder={user.phoneNumber}
                value={deleteConfirmPhone}
                onChange={e => setDeleteConfirmPhone(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmPhone.trim() !== user.phoneNumber || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
