"use client"

import React, { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  Briefcase,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ImageIcon,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react"
import type { VerificationRequest } from "@/lib/api"
import { approveVerification, getPendingVerifications, rejectVerification } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type SortMode = "NEWEST" | "OLDEST"
type CompletenessSignal = {
  score: number
  checks: Array<{ label: string; complete: boolean }>
  missing: string[]
}

function userName(request?: VerificationRequest | null) {
  if (!request) return "No request selected"
  return [request.user.firstName, request.user.lastName].filter(Boolean).join(" ") || request.user.phoneNumber || "Unnamed user"
}

function initials(request?: VerificationRequest | null) {
  return userName(request)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function relativeTime(value?: string | null) {
  if (!value) return "-"
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "-"
  const diff = Date.now() - time
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function isToday(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}

function serviceCount(request: VerificationRequest) {
  return request.user.services?.length ?? request.user._count?.services ?? 0
}

function isProviderCandidate(request: VerificationRequest) {
  return Boolean(request.user.isProvider) || request.user.roles?.includes("WORKER") || serviceCount(request) > 0
}

function trustScore(request: VerificationRequest) {
  return request.user.trustScore ?? Math.min(96, 50 + serviceCount(request) * 10 + (request.user.profilePicture ? 12 : 0) + (request.user.addresses?.length ? 10 : 0))
}

function profileCompleteness(request: VerificationRequest): CompletenessSignal {
  const checks = [
    { label: "Name", complete: Boolean(request.user.firstName || request.user.lastName) },
    { label: "Email", complete: Boolean(request.user.email) },
    { label: "Profile photo", complete: Boolean(request.user.profilePicture) },
    { label: "Address", complete: Boolean(request.user.addresses?.length) },
    { label: "Services", complete: serviceCount(request) > 0 },
  ]
  const complete = checks.filter((check) => check.complete).length
  return {
    score: Math.round((complete / checks.length) * 100),
    checks,
    missing: checks.filter((check) => !check.complete).map((check) => check.label),
  }
}

function attemptCount(request: VerificationRequest) {
  return Math.max(1, request.user.verificationRequests?.length ?? 1)
}

function imageQuality(request: VerificationRequest) {
  const score = profileCompleteness(request).score
  if (score < 60) return "Poor"
  if (score < 80) return "Fair"
  return "Good"
}

function riskBadges(request: VerificationRequest) {
  const profile = profileCompleteness(request)
  const badges: Array<{ label: string; tone: "amber" | "red" | "blue" }> = []

  if (attemptCount(request) > 1) badges.push({ label: `Repeat attempt (${attemptCount(request)})`, tone: "red" })
  if (profile.missing.includes("Address")) badges.push({ label: "Missing address", tone: "amber" })
  if (profile.missing.includes("Profile photo")) badges.push({ label: "Missing profile photo", tone: "amber" })
  if (serviceCount(request) === 0) badges.push({ label: "No services added", tone: "blue" })

  return badges
}

function ProgressBar({ value }: { value: number }) {
  const tone = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="h-1.5 w-24 rounded-full bg-muted">
      <div className={cn("h-1.5 rounded-full", tone)} style={{ width: `${Math.max(8, Math.min(100, value))}%` }} />
    </div>
  )
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
  tone: "green" | "amber" | "purple" | "red"
}) {
  const styles = {
    green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/15",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/15",
    purple: "bg-purple-500/10 text-purple-400 ring-purple-500/15",
    red: "bg-red-500/10 text-red-400 ring-red-500/15",
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

function RiskBadge({ label, tone }: { label: string; tone: "amber" | "red" | "blue" }) {
  const styles = {
    amber: "bg-amber-500/10 text-amber-300",
    red: "bg-red-500/10 text-red-300",
    blue: "bg-sky-500/10 text-sky-300",
  }

  return <Badge className={cn("border-0", styles[tone])}>{label}</Badge>
}

function UserAvatar({ request, size = "md" }: { request: VerificationRequest; size?: "md" | "lg" }) {
  const className = size === "lg" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm"
  if (request.user.profilePicture) {
    return <img src={request.user.profilePicture} alt="" className={cn(className, "shrink-0 rounded-full object-cover ring-1 ring-white/10")} />
  }
  return (
    <div className={cn(className, "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-1 ring-white/10")}>
      {initials(request)}
    </div>
  )
}

export default function VerificationsPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [documentTypeFilter, setDocumentTypeFilter] = useState("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST")
  const [hasServicesFilter, setHasServicesFilter] = useState("ALL")
  const [profilePhotoFilter, setProfilePhotoFilter] = useState("ALL")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: getPendingVerifications,
  })

  const visibleRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...requests]
      .filter((request) => {
        const haystack = `${userName(request)} ${request.user.phoneNumber || ""} ${request.user.email || ""} ${request.id}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesDocumentType = documentTypeFilter === "ALL" || request.document?.type === documentTypeFilter
        const matchesServices =
          hasServicesFilter === "ALL" ||
          (hasServicesFilter === "YES" && serviceCount(request) > 0) ||
          (hasServicesFilter === "NO" && serviceCount(request) === 0)
        const matchesPhoto =
          profilePhotoFilter === "ALL" ||
          (profilePhotoFilter === "YES" && Boolean(request.user.profilePicture)) ||
          (profilePhotoFilter === "NO" && !request.user.profilePicture)

        return matchesSearch && matchesDocumentType && matchesServices && matchesPhoto
      })
      .sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sortMode === "OLDEST" ? diff : -diff
      })
  }, [requests, searchTerm, documentTypeFilter, hasServicesFilter, profilePhotoFilter, sortMode])

  const selectedRequest = visibleRequests.find((request) => request.id === selectedId) ?? visibleRequests[0] ?? null

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] })
      toast({ title: "Approved", description: "Verification approved successfully." })
      setShowDetail(false)
      setSelectedId(null)
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to approve verification.",
        variant: "destructive",
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] })
      toast({ title: "Rejected", description: "Verification rejected." })
      setIsRejectDialogOpen(false)
      setRejectionReason("")
      setShowDetail(false)
      setSelectedId(null)
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reject verification.",
        variant: "destructive",
      })
    },
  })

  const pendingCount = requests.length
  const submittedToday = requests.filter((request) => isToday(request.createdAt)).length
  const oldestRequest = requests.reduce<VerificationRequest | null>((oldest, request) => {
    if (!oldest) return request
    return new Date(request.createdAt) < new Date(oldest.createdAt) ? request : oldest
  }, null)
  const providerCandidates = requests.filter(isProviderCandidate).length
  const repeatAttempts = requests.filter((request) => attemptCount(request) > 1).length

  const clearFilters = () => {
    setSearchTerm("")
    setDocumentTypeFilter("ALL")
    setSortMode("NEWEST")
    setHasServicesFilter("ALL")
    setProfilePhotoFilter("ALL")
  }

  const handleQuickApprove = (request: VerificationRequest) => {
    if (confirm(`Approve verification for ${userName(request)}?`)) approveMutation.mutate(request.id)
  }

  const handleReject = () => {
    if (!selectedRequest) return
    if (!rejectionReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection." })
      return
    }
    rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason.trim() })
  }

  const rejectDialog = (
    <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reason for Rejection</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Explain why this ID is being rejected. This will be visible to the worker.
          </p>
          <Textarea
            placeholder="e.g., Image is blurry, expired document, or name doesn't match profile."
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
            {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (showDetail && selectedRequest) {
    const profile = profileCompleteness(selectedRequest)
    const risks = riskBadges(selectedRequest)

    return (
      <div className="min-h-screen bg-[#101211] p-6 text-foreground">
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
                  <h1 className="line-clamp-2 text-3xl font-semibold tracking-tight">{userName(selectedRequest)}</h1>
                  <Badge className="bg-amber-500/10 text-amber-300">Pending Verification</Badge>
                  {isProviderCandidate(selectedRequest) && <Badge className="bg-emerald-500/10 text-emerald-300">Provider Candidate</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submitted {relativeTime(selectedRequest.createdAt)} · {formatDate(selectedRequest.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-emerald-700 hover:bg-emerald-600" onClick={() => handleQuickApprove(selectedRequest)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Approve Verification
              </Button>
              <Button variant="outline" className="border-red-500/40 text-red-400 hover:text-red-300" onClick={() => setIsRejectDialogOpen(true)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Verification
              </Button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
                <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold">Document Submitted</p>
                    <Badge className="bg-amber-500/10 text-amber-300">Pending</Badge>
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-white/10 bg-background/50">{selectedRequest.document?.type || "Document"}</Badge>
                    {selectedRequest.document?.documentFileName && <Badge variant="outline" className="border-white/10 bg-background/50">{selectedRequest.document.documentFileName}</Badge>}
                  </div>
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-background/50">
                    {selectedRequest.document?.documentUrl ? (
                      <img src={selectedRequest.document.documentUrl} alt="Submitted ID document" className="max-h-[460px] w-full object-contain" />
                    ) : (
                      <div className="flex h-80 items-center justify-center text-muted-foreground">
                        <ImageIcon className="mr-2 h-5 w-5" />
                        No document preview
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                    <p className="font-semibold">Applicant Profile</p>
                    <div className="mt-4 flex items-start gap-4">
                      <UserAvatar request={selectedRequest} size="lg" />
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{userName(selectedRequest)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.user.phoneNumber || "No phone"}</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.user.email || "No email"}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                        <p className="text-xs text-muted-foreground">Services</p>
                        <p className="mt-1 text-xl font-semibold">{serviceCount(selectedRequest)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                        <p className="text-xs text-muted-foreground">Trust Score</p>
                        <p className="mt-1 text-xl font-semibold text-emerald-300">{trustScore(selectedRequest)}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                        <p className="text-xs text-muted-foreground">Completeness</p>
                        <p className="mt-1 text-xl font-semibold">{profile.score}%</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                        <p className="text-xs text-muted-foreground">Attempts</p>
                        <p className="mt-1 text-xl font-semibold">{attemptCount(selectedRequest)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                    <p className="font-semibold">Profile Completeness</p>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px]">
                      <div className="space-y-2">
                        {profile.checks.map((check) => (
                          <div key={check.label} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{check.label}</span>
                            <span className={check.complete ? "text-emerald-300" : "text-amber-300"}>{check.complete ? "Yes" : "Missing"}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-center rounded-lg border border-white/5 bg-background/35 p-4">
                        <div className="text-center">
                          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-emerald-500/80 text-xl font-semibold">
                            {profile.score}%
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                    <p className="font-semibold">Risk / Notes</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {risks.length ? risks.map((risk) => <RiskBadge key={risk.label} label={risk.label} tone={risk.tone} />) : <Badge className="bg-emerald-500/10 text-emerald-300">Ready</Badge>}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {profile.missing.length ? `Missing: ${profile.missing.join(", ")}.` : "All required profile signals are present."}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Image quality: {imageQuality(selectedRequest)}</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Decision Summary</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Document Type</dt>
                    <dd>{selectedRequest.document?.type || "Document"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Profile</dt>
                    <dd>{profile.score}% complete</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Services</dt>
                    <dd>{serviceCount(selectedRequest)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Risk flags</dt>
                    <dd>{risks.length}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Take Action</p>
                <div className="mt-4 grid gap-2">
                  <Button className="h-10 bg-emerald-700 hover:bg-emerald-600" onClick={() => handleQuickApprove(selectedRequest)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                    {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve Verification
                  </Button>
                  <Button variant="outline" className="h-10 border-red-500/40 text-red-400 hover:text-red-300" onClick={() => setIsRejectDialogOpen(true)} disabled={approveMutation.isPending || rejectMutation.isPending}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Verification
                  </Button>
                  <Button variant="outline" className="h-10 border-white/10 bg-background/60" onClick={() => setShowDetail(false)}>
                    Back to Queue
                  </Button>
                </div>
              </div>
            </aside>
          </section>
        </div>
        {rejectDialog}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6 text-foreground">
      <div className="mx-auto max-w-[1780px] space-y-3">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Verifications</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review pending identity documents and provider readiness.</p>
          </div>
          <Button variant="outline" className="w-fit border-white/10 bg-card/70" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh queue
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Pending Verifications" value={pendingCount} description="Needs review" icon={<FileCheck2 className="h-4 w-4" />} tone="amber" />
          <StatCard title="Submitted Today" value={submittedToday} description="New queue items" icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
          <StatCard title="Oldest Pending" value={oldestRequest ? relativeTime(oldestRequest.createdAt) : "-"} description={oldestRequest ? `Submitted ${formatDate(oldestRequest.createdAt)}` : "No pending queue"} icon={<Clock3 className="h-4 w-4" />} tone="amber" />
          <StatCard title="Provider Candidates" value={providerCandidates} description="Have services or provider role" icon={<UserCheck className="h-4 w-4" />} tone="purple" />
          <StatCard title="Repeat Attempts" value={repeatAttempts} description="Multiple submissions" icon={<RotateCcw className="h-4 w-4" />} tone="red" />
        </div>

        <section className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_150px_150px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-white/10 bg-background/70 pl-9"
                placeholder="Search by name, phone, email or ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                <SelectItem value="GOVERNMENT_ID">Government ID</SelectItem>
                <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest</SelectItem>
                <SelectItem value="OLDEST">Oldest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={hasServicesFilter} onValueChange={setHasServicesFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All services</SelectItem>
                <SelectItem value="YES">Has services</SelectItem>
                <SelectItem value="NO">No services</SelectItem>
              </SelectContent>
            </Select>
            <Select value={profilePhotoFilter} onValueChange={setProfilePhotoFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All photos</SelectItem>
                <SelectItem value="YES">Has photo</SelectItem>
                <SelectItem value="NO">No photo</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-9 border-white/10 bg-background/70" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
          <div className="border-b border-white/5 px-4 py-3 text-sm text-muted-foreground">
            Showing 1 to {visibleRequests.length} of {visibleRequests.length} results
          </div>
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">No pending verifications match this view.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1080px]">
                <div className="grid grid-cols-[1.7fr_1fr_1.2fr_1fr_1.35fr_116px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <div>User</div>
                  <div>Document</div>
                  <div>Provider Signals</div>
                  <div>Submitted</div>
                  <div>Risk / Notes</div>
                  <div className="text-right">Actions</div>
                </div>
                {visibleRequests.map((request) => {
                  const profile = profileCompleteness(request)
                  const risks = riskBadges(request)
                  const quality = imageQuality(request)

                  return (
                    <div
                      key={request.id}
                      role="button"
                      tabIndex={0}
                      className="grid grid-cols-[1.7fr_1fr_1.2fr_1fr_1.35fr_116px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
                      onClick={() => {
                        setSelectedId(request.id)
                        setShowDetail(true)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          setSelectedId(request.id)
                          setShowDetail(true)
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar request={request} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{userName(request)}</p>
                          <p className="truncate text-xs text-muted-foreground">{request.user.phoneNumber}</p>
                          <p className="truncate text-xs text-muted-foreground">{request.user.email || "No email"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{request.document?.type || "Document"}</p>
                        <p className="text-xs text-amber-300">Pending</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{serviceCount(request)} service{serviceCount(request) === 1 ? "" : "s"}</span>
                          <ShieldCheck className="ml-2 h-3.5 w-3.5 text-emerald-400" />
                          <span>{trustScore(request)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{profile.score}%</span>
                          <ProgressBar value={profile.score} />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{relativeTime(request.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                      </div>
                      <div className="max-w-[260px] space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {risks.length ? risks.map((risk) => <RiskBadge key={risk.label} label={risk.label} tone={risk.tone} />) : <Badge className="bg-emerald-500/10 text-emerald-300">Ready</Badge>}
                        </div>
                        <p className={cn("text-xs", quality === "Poor" ? "text-red-300" : "text-muted-foreground")}>Image quality: {quality}</p>
                      </div>
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <Button
                          className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
                          size="sm"
                          onClick={() => {
                            setSelectedId(request.id)
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
          )}
        </section>
      </div>
      {rejectDialog}
    </div>
  )
}
