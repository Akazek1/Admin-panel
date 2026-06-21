"use client"

import React, { useDeferredValue, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock3,
  Eye,
  Flag,
  ImageIcon,
  Loader2,
  MessageSquare,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react"
import type { Report } from "@/lib/api"
import { getReports, resolveReport } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type SortMode = "NEWEST" | "OLDEST" | "SEVERITY"
type Severity = "High" | "Medium" | "Low"

function fullName(user?: { firstName: string | null; lastName: string | null; phoneNumber?: string | null }) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phoneNumber || "Unknown"
}

function initials(user?: { firstName: string | null; lastName: string | null; phoneNumber?: string | null }) {
  return fullName(user)
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

function reasonLabel(reason: string) {
  return reason.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function severityFor(report: Report): Severity {
  const reason = report.reason.toUpperCase()
  if (reason.includes("SAFETY") || reason.includes("FRAUD") || reason.includes("HARASS") || reason.includes("SUSPICIOUS")) return "High"
  if (reason.includes("PAYMENT") || reason.includes("NO_SHOW") || reason.includes("DISPUTE")) return "Medium"
  return "Low"
}

function statusBadgeClass(status: Report["status"]) {
  if (status === "PENDING") return "bg-amber-500/10 text-amber-300"
  if (status === "REVIEWING") return "bg-sky-500/10 text-sky-300"
  if (status === "RESOLVED") return "bg-emerald-500/10 text-emerald-300"
  return "bg-muted text-muted-foreground"
}

function severityBadgeClass(severity: Severity) {
  if (severity === "High") return "bg-red-500/10 text-red-300"
  if (severity === "Medium") return "bg-amber-500/10 text-amber-300"
  return "bg-sky-500/10 text-sky-300"
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

function UserCard({
  label,
  user,
  tone,
}: {
  label: string
  user: Report["reporter"]
  tone: "green" | "red"
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-background/35 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-white/10",
            tone === "green" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"
          )}
        >
          {initials(user)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{fullName(user)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{user.phoneNumber || "No phone"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{user.email || "No email"}</p>
        </div>
      </div>
      <Button className="mt-4 h-8 border-white/10 bg-background/60 text-xs" size="sm" variant="outline" disabled>
        View profile
      </Button>
    </div>
  )
}

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState<Report["status"]>("REVIEWING")
  const [resolutionNote, setResolutionNote] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [reasonFilter, setReasonFilter] = useState("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST")
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: getReports,
    staleTime: 2 * 60 * 1000,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      resolveReport(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] })
      toast({ title: "Report updated", description: "The report status has been updated." })
      setShowDetail(false)
      setSelectedId(null)
      setResolutionNote("")
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update report.",
        variant: "destructive",
      })
    },
  })

  const reasons = useMemo(() => Array.from(new Set(reports.map((report) => report.reason))).sort(), [reports])

  const filteredReports = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
    return [...reports]
      .filter((report) => {
        const searchStr = `${fullName(report.reporter)} ${report.reporter.phoneNumber || ""} ${fullName(report.target)} ${report.target.phoneNumber || ""} ${report.reason} ${report.description || ""}`.toLowerCase()
        const matchesSearch = !normalizedSearch || searchStr.includes(normalizedSearch)
        const matchesStatus = statusFilter === "ALL" || report.status === statusFilter
        const matchesReason = reasonFilter === "ALL" || report.reason === reasonFilter
        return matchesSearch && matchesStatus && matchesReason
      })
      .sort((a, b) => {
        if (sortMode === "SEVERITY") {
          const order = { High: 3, Medium: 2, Low: 1 }
          return order[severityFor(b)] - order[severityFor(a)]
        }
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return sortMode === "OLDEST" ? diff : -diff
      })
  }, [deferredSearchTerm, reasonFilter, reports, sortMode, statusFilter])

  const selectedReport = filteredReports.find((report) => report.id === selectedId) ?? filteredReports[0] ?? null
  const pendingCount = reports.filter((report) => report.status === "PENDING").length
  const reviewingCount = reports.filter((report) => report.status === "REVIEWING").length
  const resolvedCount = reports.filter((report) => report.status === "RESOLVED").length
  const dismissedCount = reports.filter((report) => report.status === "DISMISSED").length
  const highRiskCount = reports.filter((report) => severityFor(report) === "High").length
  const repeatTargetCount = new Set(
    reports
      .filter((report) => reports.filter((other) => other.targetId === report.targetId).length > 1)
      .map((report) => report.targetId)
  ).size

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("ALL")
    setReasonFilter("ALL")
    setSortMode("NEWEST")
  }

  const openReport = (report: Report) => {
    setSelectedId(report.id)
    setResolutionStatus(report.status === "PENDING" ? "REVIEWING" : report.status)
    setResolutionNote(report.reviewNote || "")
    setShowDetail(true)
  }

  const saveResolution = (status: Report["status"] = resolutionStatus) => {
    if (!selectedReport) return
    if (!resolutionNote.trim()) {
      toast({ title: "Missing note", description: "Please add an internal note or action taken." })
      return
    }
    resolveMutation.mutate({ id: selectedReport.id, status, note: resolutionNote.trim() })
  }

  if (showDetail && selectedReport) {
    const severity = severityFor(selectedReport)
    const targetReports = reports.filter((report) => report.targetId === selectedReport.targetId)

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
                  <h1 className="line-clamp-2 text-3xl font-semibold tracking-tight">{reasonLabel(selectedReport.reason)}</h1>
                  <Badge className={statusBadgeClass(selectedReport.status)}>{selectedReport.status}</Badge>
                  <Badge className={severityBadgeClass(severity)}>{severity} Risk</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submitted {relativeTime(selectedReport.createdAt)} · {formatDate(selectedReport.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => saveResolution("REVIEWING")} disabled={resolveMutation.isPending}>
                Mark Reviewing
              </Button>
              <Button className="bg-emerald-700 hover:bg-emerald-600" onClick={() => saveResolution("RESOLVED")} disabled={resolveMutation.isPending}>
                Resolve
              </Button>
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => saveResolution("DISMISSED")} disabled={resolveMutation.isPending}>
                Dismiss
              </Button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <UserCard label="Reporter" user={selectedReport.reporter} tone="green" />
                <UserCard label="Reported User" user={selectedReport.target} tone="red" />
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">Report Details</p>
                  <Badge variant="outline" className="border-white/10 bg-background/50">{reasonLabel(selectedReport.reason)}</Badge>
                </div>
                <div className="mt-4 rounded-lg border border-white/5 bg-background/35 p-4 text-sm leading-6 text-muted-foreground">
                  {selectedReport.description || "No additional details provided."}
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Evidence</p>
                {selectedReport.evidence.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedReport.evidence.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-white/10 bg-background/40 transition hover:opacity-80"
                      >
                        <img src={url} alt="Report evidence" className="h-40 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-white/10 text-muted-foreground">
                    <ImageIcon className="mr-2 h-5 w-5" />
                    No evidence attached
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Target History</p>
                <div className="mt-4 overflow-hidden rounded-lg border border-white/5">
                  {targetReports.map((report) => (
                    <div key={report.id} className="grid grid-cols-[1fr_120px_140px] gap-4 border-b border-white/5 px-4 py-3 text-sm last:border-b-0">
                      <span>{reasonLabel(report.reason)}</span>
                      <Badge className={statusBadgeClass(report.status)}>{report.status}</Badge>
                      <span className="text-muted-foreground">{relativeTime(report.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Triage Summary</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Severity</dt>
                    <dd><Badge className={severityBadgeClass(severity)}>{severity}</Badge></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd><Badge className={statusBadgeClass(selectedReport.status)}>{selectedReport.status}</Badge></dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reports on target</dt>
                    <dd>{targetReports.length}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Evidence</dt>
                    <dd>{selectedReport.evidence.length}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Resolution</p>
                <div className="mt-4 space-y-3">
                  <Select value={resolutionStatus} onValueChange={(value) => setResolutionStatus(value as Report["status"])}>
                    <SelectTrigger className="border-white/10 bg-background/60">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REVIEWING">Reviewing</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="DISMISSED">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    className="min-h-[120px] border-white/10 bg-background/60"
                    placeholder="Describe findings, action taken, or next step..."
                    value={resolutionNote}
                    onChange={(event) => setResolutionNote(event.target.value)}
                  />
                  {selectedReport.reviewer && selectedReport.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last updated by {selectedReport.reviewer.firstName} {selectedReport.reviewer.lastName} on {formatDate(selectedReport.reviewedAt)}
                    </p>
                  )}
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-600" onClick={() => saveResolution()} disabled={resolveMutation.isPending}>
                    {resolveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Save Resolution
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
                <p className="font-semibold">Admin Actions</p>
                <div className="mt-4 grid gap-2">
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Conversation
                  </Button>
                  <Button className="h-9 justify-start border-white/10 bg-background/60" variant="outline" disabled>
                    <UserRound className="mr-2 h-4 w-4" />
                    View Target Profile
                  </Button>
                  <Button className="h-9 justify-start border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10" variant="outline" disabled>
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Suspend User
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
            <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">Triage user reports, risk signals, and trust-and-safety outcomes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-6">
          <StatCard title="New Reports" value={pendingCount} description="Need review" icon={<Flag className="h-4 w-4" />} tone="amber" />
          <StatCard title="Under Review" value={reviewingCount} description="Being handled" icon={<Eye className="h-4 w-4" />} tone="blue" />
          <StatCard title="Resolved" value={resolvedCount} description="Action taken" icon={<CheckCircle className="h-4 w-4" />} tone="green" />
          <StatCard title="Dismissed" value={dismissedCount} description="No action needed" icon={<XCircle className="h-4 w-4" />} tone="purple" />
          <StatCard title="Repeat Targets" value={repeatTargetCount} description="Reported more than once" icon={<UserRound className="h-4 w-4" />} tone="red" />
          <StatCard title="High Risk" value={highRiskCount} description="Safety or fraud signals" icon={<AlertTriangle className="h-4 w-4" />} tone="red" />
        </div>

        <div className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_170px_190px_170px_120px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-white/10 bg-background/70 pl-9"
                placeholder="Search by reporter, target, reason, or description..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Reasons</SelectItem>
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>{reasonLabel(reason)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest</SelectItem>
                <SelectItem value="OLDEST">Oldest</SelectItem>
                <SelectItem value="SEVERITY">Severity</SelectItem>
              </SelectContent>
            </Select>
            <Button className="h-9 border-white/10 bg-background/70" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-lg border border-white/5 bg-card/70 p-2">
          {[
            ["ALL", "All Reports", reports.length],
            ["PENDING", "Pending", pendingCount],
            ["REVIEWING", "Reviewing", reviewingCount],
            ["RESOLVED", "Resolved", resolvedCount],
            ["DISMISSED", "Dismissed", dismissedCount],
          ].map(([value, label, count]) => (
            <button
              key={String(value)}
              className={cn(
                "rounded-md border border-white/10 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                statusFilter === value && "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              )}
              onClick={() => setStatusFilter(value as string)}
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
            <p className="font-medium">Could not load reports</p>
            <p className="mt-1 text-sm text-muted-foreground">Please refresh or check the backend connection.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 bg-card/40 p-16 text-center">
            <p className="font-medium">No reports found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or checking backend data.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid min-w-[1080px] grid-cols-[1fr_1fr_1fr_.7fr_.75fr_.9fr_86px] border-b border-white/5 px-4 py-3 text-xs font-medium text-muted-foreground">
              <div>Reporter</div>
              <div>Reported User</div>
              <div>Reason</div>
              <div>Severity</div>
              <div>Status</div>
              <div>Submitted</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[1080px]">
                {filteredReports.map((report) => {
                  const severity = severityFor(report)
                  return (
                    <div
                      key={report.id}
                      role="button"
                      tabIndex={0}
                      className="grid w-full grid-cols-[1fr_1fr_1fr_.7fr_.75fr_.9fr_86px] items-center border-b border-white/5 px-4 py-4 text-left transition hover:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-500/40"
                      onClick={() => openReport(report)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          openReport(report)
                        }
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{fullName(report.reporter)}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{report.reporter.phoneNumber || "No phone"}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{fullName(report.target)}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{report.target.phoneNumber || "No phone"}</p>
                      </div>
                      <div>
                        <Badge variant="outline" className="border-white/10 bg-background/50">{reasonLabel(report.reason)}</Badge>
                      </div>
                      <div>
                        <Badge className={severityBadgeClass(severity)}>{severity}</Badge>
                      </div>
                      <div>
                        <Badge className={statusBadgeClass(report.status)}>{report.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{relativeTime(report.createdAt)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                      </div>
                      <div className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
                        <Button className="h-8 bg-emerald-600 px-3 text-xs hover:bg-emerald-700" size="sm" onClick={() => openReport(report)}>
                          Open
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 to {filteredReports.length} of {reports.length} reports</span>
              <span>50 / page</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
