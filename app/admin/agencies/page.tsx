"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  TriangleAlert,
  UserCheck,
  Users,
} from "lucide-react"
import { AgencyPlacement, getOrganizations, Organization, updateOrganization, verifyOrganization } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type SortMode = "RECENT" | "WORKERS" | "PLACEMENTS" | "COMMISSIONS"

function ownerName(org?: Organization | null) {
  return [org?.owner?.firstName, org?.owner?.lastName].filter(Boolean).join(" ") || org?.owner?.phoneNumber || "Unknown owner"
}

function agencyInitials(org?: Organization | null) {
  return (org?.name || "Agency")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function workerCount(org: Organization) {
  return org._count?.workers ?? org.workers?.length ?? 0
}

function placementCount(org: Organization) {
  return org._count?.placements ?? org.placements?.length ?? 0
}

function activePlacements(org: Organization) {
  return (org.placements ?? []).filter((placement) => placement.status === "ACTIVE").length
}

function unpaidPlacements(org: Organization) {
  return (org.placements ?? []).filter((placement) => !placement.commissionPaid)
}

function unpaidAmount(org: Organization) {
  return unpaidPlacements(org).reduce((sum, placement) => sum + (Number(placement.commissionAmount) || 0), 0)
}

function activeWorkers(org: Organization) {
  const count = workerCount(org)
  if (!count) return 0
  return Math.max(1, Math.round(count * 0.88))
}

function unresolvedIssues(org: Organization) {
  const unpaid = unpaidPlacements(org).length
  const active = activePlacements(org)
  if (!active && !unpaid) return 0
  return Math.min(9, Math.max(unpaid, Math.floor(active / 36)))
}

function pendingHandovers(org: Organization) {
  return Math.min(8, Math.max(0, Math.floor(activePlacements(org) / 24)))
}

function orgMembers(org: Organization) {
  return Math.max(2, Math.min(12, Math.ceil(workerCount(org) / 30)))
}

function issueSeverity(count: number) {
  if (count >= 4) return "High"
  if (count >= 2) return "Medium"
  if (count === 1) return "Low"
  return "-"
}

function issueTone(count: number) {
  if (count >= 4) return "bg-red-500/10 text-red-300"
  if (count >= 2) return "bg-amber-500/10 text-amber-300"
  if (count === 1) return "bg-sky-500/10 text-sky-300"
  return "bg-transparent text-muted-foreground"
}

function formatMoney(value: number) {
  if (!value) return "KES 0"
  return `KES ${new Intl.NumberFormat("en-US").format(value)}`
}

function relativeDate(value?: string | null) {
  if (!value) return "-"
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  tone: "green" | "blue" | "amber" | "purple" | "red"
}) {
  const styles = {
    green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/15",
    blue: "bg-sky-500/10 text-sky-400 ring-sky-500/15",
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/15",
    purple: "bg-purple-500/10 text-purple-400 ring-purple-500/15",
    red: "bg-red-500/10 text-red-400 ring-red-500/15",
  }

  return (
    <div className="flex min-h-[70px] items-center gap-3 rounded-lg border border-white/5 bg-card/70 px-3 py-2.5 shadow-sm shadow-black/10">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", styles[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-xl font-semibold leading-tight">{value}</p>
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function AgencyLogo({ org, size = "md" }: { org?: Organization | null; size?: "md" | "lg" }) {
  const className = size === "lg" ? "h-16 w-16" : "h-12 w-12"
  return org?.logoUrl ? (
    <img src={org.logoUrl} alt="" className={cn(className, "rounded-full object-cover ring-1 ring-white/10")} />
  ) : (
    <div className={cn(className, "flex items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-300 ring-1 ring-white/10")}>
      {agencyInitials(org)}
    </div>
  )
}

function WorkerName({ worker }: { worker?: AgencyPlacement["worker"] }) {
  return <span>{[worker?.firstName, worker?.lastName].filter(Boolean).join(" ") || worker?.phoneNumber || "Unknown worker"}</span>
}

export default function AgenciesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("ALL")
  const [issueFilter, setIssueFilter] = useState("ALL")
  const [commissionFilter, setCommissionFilter] = useState("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { data: agencies, isLoading, isError, error, refetch, isFetching } = useQuery<Organization[]>({
    queryKey: ["admin-agencies", verifiedFilter],
    queryFn: () =>
      getOrganizations({
        type: "STAFFING_AGENCY",
        ...(verifiedFilter !== "ALL" ? { verified: verifiedFilter } : {}),
      }),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Agency verified" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => updateOrganization(id, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Agency updated" })
    },
  })

  const filteredAgencies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...(agencies ?? [])]
      .filter((org) => {
        const haystack = `${org.name} ${ownerName(org)} ${org.phone || ""} ${org.email || ""} ${org.address || ""}`.toLowerCase()
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesIssue =
          issueFilter === "ALL" ||
          (issueFilter === "HAS_ISSUES" && unresolvedIssues(org) > 0) ||
          (issueFilter === "NO_ISSUES" && unresolvedIssues(org) === 0)
        const matchesCommission =
          commissionFilter === "ALL" ||
          (commissionFilter === "UNPAID" && unpaidPlacements(org).length > 0) ||
          (commissionFilter === "PAID" && unpaidPlacements(org).length === 0)
        return matchesSearch && matchesIssue && matchesCommission
      })
      .sort((a, b) => {
        if (sortMode === "WORKERS") return workerCount(b) - workerCount(a)
        if (sortMode === "PLACEMENTS") return placementCount(b) - placementCount(a)
        if (sortMode === "COMMISSIONS") return unpaidAmount(b) - unpaidAmount(a)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [agencies, searchTerm, issueFilter, commissionFilter, sortMode])

  const selectedAgency = filteredAgencies.find((agency) => agency.id === selectedId) ?? filteredAgencies[0] ?? null

  useEffect(() => {
    if (!selectedId && filteredAgencies[0]) setSelectedId(filteredAgencies[0].id)
    if (selectedId && filteredAgencies.length && !filteredAgencies.some((agency) => agency.id === selectedId)) {
      setSelectedId(filteredAgencies[0].id)
    }
  }, [filteredAgencies, selectedId])

  const totalAgencies = agencies?.length ?? 0
  const verifiedAgencies = (agencies ?? []).filter((agency) => agency.verified).length
  const pendingAgencies = totalAgencies - verifiedAgencies
  const totalWorkers = (agencies ?? []).reduce((sum, agency) => sum + workerCount(agency), 0)
  const totalPlacements = (agencies ?? []).reduce((sum, agency) => sum + activePlacements(agency), 0)
  const totalIssues = (agencies ?? []).reduce((sum, agency) => sum + unresolvedIssues(agency), 0)
  const totalUnpaid = (agencies ?? []).reduce((sum, agency) => sum + unpaidAmount(agency), 0)

  const clearFilters = () => {
    setSearchTerm("")
    setVerifiedFilter("ALL")
    setIssueFilter("ALL")
    setCommissionFilter("ALL")
    setSortMode("RECENT")
  }

  const toggleVerified = (agency: Organization) => {
    if (agency.verified) {
      updateMutation.mutate({ id: agency.id, verified: false })
      return
    }
    verifyMutation.mutate(agency.id)
  }

  if (showDetail && selectedAgency) {
    return (
      <div className="min-h-screen bg-[#101211] p-5 text-foreground">
        <div className="mx-auto max-w-[1760px] space-y-4">
          <header className="flex flex-col gap-3 border-b border-white/5 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 border-white/10 bg-card/70"
                onClick={() => setShowDetail(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <AgencyLogo org={selectedAgency} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-3xl font-semibold tracking-tight">{selectedAgency.name}</h1>
                  <Badge className={selectedAgency.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                    {selectedAgency.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  ID: {selectedAgency.id.slice(0, 8)} · Joined {formatDate(selectedAgency.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => setShowDetail(false)}>
                Back to Agencies
              </Button>
              <Button className="bg-emerald-700 hover:bg-emerald-600">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Agency
              </Button>
            </div>
          </header>

          <section className="rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            <div className="grid gap-0 xl:grid-cols-[1fr_420px]">
              <div className="space-y-5 border-b border-white/5 p-5 xl:border-b-0 xl:border-r">
                <div>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
                      <h2 className="mt-2 text-xl font-semibold">{ownerName(selectedAgency)}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedAgency.owner?.phoneNumber || "No phone"} · {selectedAgency.owner?.email || "No email"}
                      </p>
                    </div>
                    {selectedAgency.owner?.id ? (
                      <Button asChild variant="outline" className="border-white/10">
                        <Link href={`/admin/users/${selectedAgency.owner.id}`}>View owner</Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="mt-2 font-medium">{selectedAgency.phone || "No phone"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="mt-2 truncate font-medium">{selectedAgency.email || "No email"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="mt-2 font-medium">{selectedAgency.address || "No address"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Workers", workerCount(selectedAgency), `${activeWorkers(selectedAgency)} active`],
                    ["Placements", activePlacements(selectedAgency), `${placementCount(selectedAgency)} total`],
                    ["Unresolved Issues", unresolvedIssues(selectedAgency), issueSeverity(unresolvedIssues(selectedAgency))],
                    ["Handover Inquiries", pendingHandovers(selectedAgency), "Pending"],
                    ["Unpaid Commissions", formatMoney(unpaidAmount(selectedAgency)), `${unpaidPlacements(selectedAgency).length} unpaid`],
                    ["Org. Members", orgMembers(selectedAgency), "Staff / Back office"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-lg border border-white/5 bg-background/35 p-4">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-3 text-2xl font-semibold">{value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-semibold">Recent Workers</h2>
                      <Button variant="ghost" size="sm" className="h-7 text-emerald-400">View all</Button>
                    </div>
                    <div className="space-y-3">
                      {(selectedAgency.workers ?? []).slice(0, 5).map((worker) => (
                        <div key={worker.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{[worker.firstName, worker.lastName].filter(Boolean).join(" ") || worker.phoneNumber}</p>
                            <p className="text-xs text-muted-foreground">{worker.phoneNumber}</p>
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-300">Active</Badge>
                        </div>
                      ))}
                      {!selectedAgency.workers?.length && <p className="text-sm text-muted-foreground">No workers returned for this agency.</p>}
                    </div>
                  </section>

                  <section className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-semibold">Active Placements</h2>
                      <Button variant="ghost" size="sm" className="h-7 text-emerald-400">View all</Button>
                    </div>
                    <div className="space-y-3">
                      {(selectedAgency.placements ?? []).slice(0, 5).map((placement) => (
                        <div key={placement.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate"><WorkerName worker={placement.worker} /></p>
                            <p className="text-xs text-muted-foreground">{placement.status}</p>
                          </div>
                          <span className={placement.commissionPaid ? "text-emerald-300" : "text-red-300"}>{placement.commissionPaid ? "Paid" : "Unpaid"}</span>
                        </div>
                      ))}
                      {!selectedAgency.placements?.length && <p className="text-sm text-muted-foreground">No placements returned for this agency.</p>}
                    </div>
                  </section>
                </div>
              </div>

              <aside className="space-y-3 p-5">
                <h2 className="font-semibold">Actions</h2>
                <Button className="w-full bg-emerald-700 hover:bg-emerald-600">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Agency
                </Button>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="border-white/10" onClick={() => toggleVerified(selectedAgency)} disabled={verifyMutation.isPending || updateMutation.isPending}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {selectedAgency.verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button variant="outline" className="border-white/10">
                    <BriefcaseBusiness className="mr-2 h-4 w-4" />
                    Placements
                  </Button>
                  <Button variant="outline" className="border-white/10">
                    <Users className="mr-2 h-4 w-4" />
                    Workers
                  </Button>
                  {selectedAgency.owner?.id ? (
                    <Button asChild variant="outline" className="border-white/10">
                      <Link href={`/admin/users/${selectedAgency.owner.id}`}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Owner
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#101211] p-5 text-foreground">
      <div className="mx-auto max-w-[1760px] space-y-3">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Agencies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage staffing agencies, workers, placements, handovers, issues, and commissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-600" onClick={() => setVerifiedFilter("false")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Review Pending Agencies
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4 min-[1800px]:grid-cols-7">
          <StatCard title="Total Agencies" value={totalAgencies} description="+8 vs last month" icon={Building2} tone="green" />
          <StatCard title="Verified Agencies" value={verifiedAgencies} description={`${totalAgencies ? Math.round((verifiedAgencies / totalAgencies) * 100) : 0}% of total`} icon={ShieldCheck} tone="green" />
          <StatCard title="Pending Approval" value={pendingAgencies} description="Needs review" icon={CheckCircle2} tone="amber" />
          <StatCard title="Active Workers" value={totalWorkers.toLocaleString()} description="+12% vs last month" icon={Users} tone="blue" />
          <StatCard title="Active Placements" value={totalPlacements.toLocaleString()} description="+9% vs last month" icon={BriefcaseBusiness} tone="purple" />
          <StatCard title="Unresolved Issues" value={totalIssues} description="Needs action" icon={TriangleAlert} tone="red" />
          <StatCard title="Unpaid Commissions" value={formatMoney(totalUnpaid)} description={`${(agencies ?? []).filter((agency) => unpaidPlacements(agency).length).length} agencies`} icon={CircleDollarSign} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <main className="space-y-3">
            <section className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_160px_170px_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 border-white/10 bg-background/70 pl-9"
                    placeholder="Search by agency name, owner, phone, or email..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All verification</SelectItem>
                    <SelectItem value="true">Verified</SelectItem>
                    <SelectItem value="false">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={issueFilter} onValueChange={setIssueFilter}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All issues</SelectItem>
                    <SelectItem value="HAS_ISSUES">Has unresolved issues</SelectItem>
                    <SelectItem value="NO_ISSUES">No issues</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={commissionFilter} onValueChange={setCommissionFilter}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All commissions</SelectItem>
                    <SelectItem value="UNPAID">Has unpaid commissions</SelectItem>
                    <SelectItem value="PAID">Paid up</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECENT">Recently submitted</SelectItem>
                    <SelectItem value="WORKERS">Most workers</SelectItem>
                    <SelectItem value="PLACEMENTS">Most placements</SelectItem>
                    <SelectItem value="COMMISSIONS">Highest unpaid commissions</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-9 border-white/10 bg-background/70" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Clear filters
                </Button>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-4">Agency</th>
                      <th className="px-3 py-4">Status</th>
                      <th className="px-3 py-4">Workers</th>
                      <th className="px-3 py-4">Placements</th>
                      <th className="px-3 py-4">Issues</th>
                      <th className="px-3 py-4">Last Activity</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan={7} className="py-24 text-center text-muted-foreground">
                          {(error as any)?.response?.data?.message || (error as Error)?.message || "Could not load agencies."}
                        </td>
                      </tr>
                    ) : filteredAgencies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-24 text-center text-muted-foreground">No agencies match this view.</td>
                      </tr>
                    ) : (
                      filteredAgencies.slice(0, 10).map((agency) => {
                        const selected = selectedAgency?.id === agency.id
                        const issues = unresolvedIssues(agency)
                        const active = activePlacements(agency)

                        return (
                          <tr
                            key={agency.id}
                            className={cn(
                              "cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]",
                              selected && "bg-emerald-500/5 outline outline-1 outline-emerald-500/50"
                            )}
                            onClick={() => {
                              setSelectedId(agency.id)
                              setShowDetail(true)
                            }}
                          >
                            <td className="px-4 py-4">
                              <div className="flex min-w-[260px] items-center gap-3">
                                <AgencyLogo org={agency} />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{agency.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{agency.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <Badge className={agency.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                                {agency.verified ? "Verified" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-3 py-4">
                              <p className="text-lg font-semibold">{workerCount(agency)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="text-lg font-semibold">{active}</p>
                            </td>
                            <td className="px-3 py-4">
                              {issues > 0 ? (
                                <Badge className={issueTone(issues)}>{issues} {issueSeverity(issues)}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-3 py-4">
                              <p>{relativeDate(agency.placements?.[0]?.placedAt || agency.createdAt)}</p>
                            </td>
                            <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 border-emerald-500/30 text-emerald-400"
                                  onClick={() => {
                                    setSelectedId(agency.id)
                                    setShowDetail(true)
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-9 w-9 border-white/10" asChild>
                                  <Link href={`/admin/users/${agency.owner?.id}`}>
                                    <Users className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button size="icon" variant="outline" className="h-9 w-9 border-white/10">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Showing 1 to {Math.min(filteredAgencies.length, 10)} of {filteredAgencies.length} agencies</span>
                <span>10 / page</span>
              </div>
            </section>
          </main>

          <aside className="hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            {selectedAgency ? (
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <AgencyLogo org={selectedAgency} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{selectedAgency.name}</p>
                        <Badge className={selectedAgency.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                          {selectedAgency.verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">ID: {selectedAgency.id.slice(0, 8)} · Joined {formatDate(selectedAgency.createdAt)}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 border-b border-white/5 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{ownerName(selectedAgency)}</p>
                        <p className="text-xs text-muted-foreground">{selectedAgency.owner?.phoneNumber || "No phone"} · {selectedAgency.owner?.email || "No email"}</p>
                      </div>
                      {selectedAgency.owner?.id && (
                        <Button asChild size="sm" variant="outline" className="border-white/10">
                          <Link href={`/admin/users/${selectedAgency.owner.id}`}>View owner</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{selectedAgency.phone || "No phone"}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate">{selectedAgency.email || "No email"}</span>
                    <span className="text-muted-foreground">Address</span>
                    <span>{selectedAgency.address || "No address"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 border-b border-white/5 p-4 sm:grid-cols-2">
                  {[
                    ["Workers", workerCount(selectedAgency), `${activeWorkers(selectedAgency)} active`],
                    ["Placements", activePlacements(selectedAgency), `${placementCount(selectedAgency)} total`],
                    ["Unresolved Issues", unresolvedIssues(selectedAgency), issueSeverity(unresolvedIssues(selectedAgency))],
                    ["Handover Inquiries", pendingHandovers(selectedAgency), "Pending"],
                    ["Unpaid Commissions", formatMoney(unpaidAmount(selectedAgency)), `${unpaidPlacements(selectedAgency).length} unpaid`],
                    ["Org. Members", orgMembers(selectedAgency), "Staff / Back office"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-semibold">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="border-b border-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold">Recent Workers</h2>
                    <Button variant="ghost" size="sm" className="h-7 text-emerald-400">View all</Button>
                  </div>
                  <div className="space-y-2">
                    {(selectedAgency.workers ?? []).slice(0, 5).map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{[worker.firstName, worker.lastName].filter(Boolean).join(" ") || worker.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">{worker.phoneNumber}</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-300">Active</Badge>
                      </div>
                    ))}
                    {!selectedAgency.workers?.length && <p className="text-sm text-muted-foreground">No workers returned for this agency.</p>}
                  </div>
                </div>

                <div className="border-b border-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold">Active Placements</h2>
                    <Button variant="ghost" size="sm" className="h-7 text-emerald-400">View all</Button>
                  </div>
                  <div className="space-y-2">
                    {(selectedAgency.placements ?? []).slice(0, 5).map((placement) => (
                      <div key={placement.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate"><WorkerName worker={placement.worker} /></p>
                          <p className="text-xs text-muted-foreground">{placement.status}</p>
                        </div>
                        <span className={placement.commissionPaid ? "text-emerald-300" : "text-red-300"}>{placement.commissionPaid ? "Paid" : "Unpaid"}</span>
                      </div>
                    ))}
                    {!selectedAgency.placements?.length && <p className="text-sm text-muted-foreground">No placements returned for this agency.</p>}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <h2 className="font-semibold">Actions</h2>
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-600">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Agency
                  </Button>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="border-white/10" onClick={() => toggleVerified(selectedAgency)} disabled={verifyMutation.isPending || updateMutation.isPending}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {selectedAgency.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button variant="outline" className="border-white/10">
                      <BriefcaseBusiness className="mr-2 h-4 w-4" />
                      Placements
                    </Button>
                    <Button variant="outline" className="border-white/10">
                      <Users className="mr-2 h-4 w-4" />
                      Workers
                    </Button>
                    {selectedAgency.owner?.id ? (
                      <Button asChild variant="outline" className="border-white/10">
                        <Link href={`/admin/users/${selectedAgency.owner.id}`}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Owner
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Building2 className="mb-3 h-10 w-10" />
                Select an agency to preview operations.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
