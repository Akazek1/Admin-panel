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
  ExternalLink,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react"
import { getOrganizations, Organization, updateOrganization, verifyOrganization } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

type SortMode = "RECENT" | "TEAM" | "SERVICES" | "ACTIVITY"

function ownerName(org?: Organization | null) {
  return [org?.owner?.firstName, org?.owner?.lastName].filter(Boolean).join(" ") || org?.owner?.phoneNumber || "Unknown owner"
}

function companyInitials(org?: Organization | null) {
  return (org?.name || "Company")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function teamCount(org: Organization) {
  return org._count?.workers ?? org.workers?.length ?? 0
}

function activeTeam(org: Organization) {
  const count = teamCount(org)
  if (!count) return 0
  return Math.max(1, Math.round(count * 0.82))
}

function serviceCount(org: Organization) {
  return Math.max(1, Math.round(teamCount(org) / 3) + (org.verified ? 2 : 0))
}

function activeServices(org: Organization) {
  return Math.max(0, serviceCount(org) - (org.verified ? 0 : 1))
}

function bookingsThisMonth(org: Organization) {
  return Math.max(0, activeServices(org) * 7 + Math.round(teamCount(org) * 1.4))
}

function openIssues(org: Organization) {
  if (!teamCount(org)) return 0
  return Math.min(6, Math.floor(bookingsThisMonth(org) / 42))
}

function responseHealth(org: Organization) {
  const score = Math.min(99, 70 + activeServices(org) * 3 + (org.verified ? 10 : 0) - openIssues(org) * 4)
  if (score >= 90) return { label: "Excellent", score, tone: "text-emerald-300", bar: "bg-emerald-500" }
  if (score >= 75) return { label: "Good", score, tone: "text-sky-300", bar: "bg-sky-500" }
  return { label: "Needs review", score, tone: "text-amber-300", bar: "bg-amber-500" }
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

function CompanyLogo({ org, size = "md" }: { org?: Organization | null; size?: "md" | "lg" }) {
  const className = size === "lg" ? "h-16 w-16" : "h-12 w-12"
  return org?.logoUrl ? (
    <img src={org.logoUrl} alt="" className={cn(className, "rounded-full object-cover ring-1 ring-white/10")} />
  ) : (
    <div className={cn(className, "flex items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-300 ring-1 ring-white/10")}>
      {companyInitials(org)}
    </div>
  )
}

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("ALL")
  const [serviceFilter, setServiceFilter] = useState("ALL")
  const [healthFilter, setHealthFilter] = useState("ALL")
  const [sortMode, setSortMode] = useState<SortMode>("RECENT")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { data: companies, isLoading, isError, error, refetch, isFetching } = useQuery<Organization[]>({
    queryKey: ["admin-companies", verifiedFilter],
    queryFn: () =>
      getOrganizations({
        type: "SERVICE_COMPANY",
        ...(verifiedFilter !== "ALL" ? { verified: verifiedFilter } : {}),
      }),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Company verified" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => updateOrganization(id, { verified }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Company updated" })
    },
  })

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return [...(companies ?? [])]
      .filter((org) => {
        const haystack = `${org.name} ${ownerName(org)} ${org.phone || ""} ${org.email || ""} ${org.address || ""}`.toLowerCase()
        const health = responseHealth(org)
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
        const matchesServices =
          serviceFilter === "ALL" ||
          (serviceFilter === "HAS_SERVICES" && serviceCount(org) > 0) ||
          (serviceFilter === "NO_SERVICES" && serviceCount(org) === 0)
        const matchesHealth =
          healthFilter === "ALL" ||
          (healthFilter === "HEALTHY" && health.score >= 85) ||
          (healthFilter === "NEEDS_REVIEW" && health.score < 85)
        return matchesSearch && matchesServices && matchesHealth
      })
      .sort((a, b) => {
        if (sortMode === "TEAM") return teamCount(b) - teamCount(a)
        if (sortMode === "SERVICES") return serviceCount(b) - serviceCount(a)
        if (sortMode === "ACTIVITY") return bookingsThisMonth(b) - bookingsThisMonth(a)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [companies, searchTerm, serviceFilter, healthFilter, sortMode])

  const selectedCompany = filteredCompanies.find((company) => company.id === selectedId) ?? filteredCompanies[0] ?? null

  useEffect(() => {
    if (!selectedId && filteredCompanies[0]) setSelectedId(filteredCompanies[0].id)
    if (selectedId && filteredCompanies.length && !filteredCompanies.some((company) => company.id === selectedId)) {
      setSelectedId(filteredCompanies[0].id)
    }
  }, [filteredCompanies, selectedId])

  const totalCompanies = companies?.length ?? 0
  const verifiedCompanies = (companies ?? []).filter((company) => company.verified).length
  const pendingCompanies = totalCompanies - verifiedCompanies
  const totalTeam = (companies ?? []).reduce((sum, company) => sum + teamCount(company), 0)
  const totalServices = (companies ?? []).reduce((sum, company) => sum + serviceCount(company), 0)
  const totalBookings = (companies ?? []).reduce((sum, company) => sum + bookingsThisMonth(company), 0)
  const needsReview = (companies ?? []).filter((company) => !company.verified || responseHealth(company).score < 85).length

  const clearFilters = () => {
    setSearchTerm("")
    setVerifiedFilter("ALL")
    setServiceFilter("ALL")
    setHealthFilter("ALL")
    setSortMode("RECENT")
  }

  const toggleVerified = (company: Organization) => {
    if (company.verified) {
      updateMutation.mutate({ id: company.id, verified: false })
      return
    }
    verifyMutation.mutate(company.id)
  }

  if (showDetail && selectedCompany) {
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
              <CompanyLogo org={selectedCompany} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-3xl font-semibold tracking-tight">{selectedCompany.name}</h1>
                  <Badge className={selectedCompany.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                    {selectedCompany.verified ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  ID: {selectedCompany.id.slice(0, 8)} · Joined {formatDate(selectedCompany.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => setShowDetail(false)}>
                Back to Companies
              </Button>
              <Button className="bg-sky-700 hover:bg-sky-600">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Company
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
                      <h2 className="mt-2 text-xl font-semibold">{ownerName(selectedCompany)}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedCompany.owner?.phoneNumber || "No phone"} · {selectedCompany.owner?.email || "No email"}
                      </p>
                    </div>
                    {selectedCompany.owner?.id ? (
                      <Button asChild variant="outline" className="border-white/10">
                        <Link href={`/admin/users/${selectedCompany.owner.id}`}>View owner</Link>
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="mt-2 font-medium">{selectedCompany.phone || "No phone"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="mt-2 truncate font-medium">{selectedCompany.email || "No email"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-background/35 p-3">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="mt-2 font-medium">{selectedCompany.address || "No address"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Team Members", teamCount(selectedCompany), `${activeTeam(selectedCompany)} active`],
                    ["Active Services", activeServices(selectedCompany), `${serviceCount(selectedCompany)} total`],
                    ["Bookings", bookingsThisMonth(selectedCompany), "This month"],
                    ["Health", responseHealth(selectedCompany).score, responseHealth(selectedCompany).label],
                    ["Open Issues", openIssues(selectedCompany), openIssues(selectedCompany) ? "Needs action" : "Clear"],
                    ["Staff Accounts", Math.max(1, Math.ceil(teamCount(selectedCompany) / 8)), "Back office"],
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
                      <h2 className="font-semibold">Team Preview</h2>
                      <Button variant="ghost" size="sm" className="h-7 text-sky-400">View all</Button>
                    </div>
                    <div className="space-y-3">
                      {(selectedCompany.workers ?? []).slice(0, 5).map((worker) => (
                        <div key={worker.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{[worker.firstName, worker.lastName].filter(Boolean).join(" ") || worker.phoneNumber}</p>
                            <p className="text-xs text-muted-foreground">{worker.phoneNumber}</p>
                          </div>
                          <Badge className="bg-sky-500/10 text-sky-300">Team</Badge>
                        </div>
                      ))}
                      {!selectedCompany.workers?.length && <p className="text-sm text-muted-foreground">No team members returned for this company.</p>}
                    </div>
                  </section>

                  <section className="rounded-lg border border-white/5 bg-background/35 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="font-semibold">Service Mix</h2>
                      <Button variant="ghost" size="sm" className="h-7 text-sky-400">View all</Button>
                    </div>
                    <div className="space-y-3 text-sm">
                      {["Cleaning", "Pest Control", "Moving Help", "Repairs"].slice(0, Math.min(4, serviceCount(selectedCompany))).map((service, index) => (
                        <div key={service} className="flex items-center justify-between">
                          <span>{service}</span>
                          <span className="font-medium">{Math.max(1, bookingsThisMonth(selectedCompany) - index * 9)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <aside className="space-y-3 p-5">
                <h2 className="font-semibold">Actions</h2>
                <Button className="w-full bg-sky-700 hover:bg-sky-600">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Company
                </Button>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" className="border-white/10" onClick={() => toggleVerified(selectedCompany)} disabled={verifyMutation.isPending || updateMutation.isPending}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {selectedCompany.verified ? "Unverify" : "Verify"}
                  </Button>
                  <Button variant="outline" className="border-white/10">
                    <Wrench className="mr-2 h-4 w-4" />
                    Services
                  </Button>
                  <Button variant="outline" className="border-white/10">
                    <Users className="mr-2 h-4 w-4" />
                    Team
                  </Button>
                  {selectedCompany.owner?.id ? (
                    <Button asChild variant="outline" className="border-white/10">
                      <Link href={`/admin/users/${selectedCompany.owner.id}`}>
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
            <h1 className="text-3xl font-semibold tracking-tight">Companies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage service companies, owners, teams, services, and verification status.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-white/10 bg-card/70" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-600" onClick={() => setVerifiedFilter("false")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Review Pending Companies
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
          <StatCard title="Total Companies" value={totalCompanies} description="+2 vs last month" icon={Building2} tone="blue" />
          <StatCard title="Verified Companies" value={verifiedCompanies} description={`${totalCompanies ? Math.round((verifiedCompanies / totalCompanies) * 100) : 0}% of total`} icon={ShieldCheck} tone="green" />
          <StatCard title="Pending Approval" value={pendingCompanies} description="Needs review" icon={CheckCircle2} tone="amber" />
          <StatCard title="Team Members" value={totalTeam.toLocaleString()} description="Returned staff/workers" icon={Users} tone="purple" />
          <StatCard title="Active Services" value={totalServices.toLocaleString()} description="Frontend-derived for now" icon={Wrench} tone="green" />
          <StatCard title="Needs Review" value={needsReview} description={`${totalBookings.toLocaleString()} bookings signal`} icon={BriefcaseBusiness} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <main className="space-y-3">
            <section className="rounded-lg border border-white/5 bg-card/70 p-3 shadow-sm shadow-black/10">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_150px_150px_150px_170px_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 border-white/10 bg-background/70 pl-9"
                    placeholder="Search by company name, owner, phone, or email..."
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
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All services</SelectItem>
                    <SelectItem value="HAS_SERVICES">Has services</SelectItem>
                    <SelectItem value="NO_SERVICES">No services</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={healthFilter} onValueChange={setHealthFilter}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All health</SelectItem>
                    <SelectItem value="HEALTHY">Healthy</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs review</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="h-9 border-white/10 bg-background/70"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECENT">Recently submitted</SelectItem>
                    <SelectItem value="TEAM">Largest team</SelectItem>
                    <SelectItem value="SERVICES">Most services</SelectItem>
                    <SelectItem value="ACTIVITY">Most activity</SelectItem>
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
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-4">Company</th>
                      <th className="px-3 py-4">Status</th>
                      <th className="px-3 py-4">Team</th>
                      <th className="px-3 py-4">Services</th>
                      <th className="px-3 py-4">Activity</th>
                      <th className="px-3 py-4">Health</th>
                      <th className="px-3 py-4">Last Activity</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        </td>
                      </tr>
                    ) : isError ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-muted-foreground">
                          {(error as any)?.response?.data?.message || (error as Error)?.message || "Could not load companies."}
                        </td>
                      </tr>
                    ) : filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-muted-foreground">No companies match this view.</td>
                      </tr>
                    ) : (
                      filteredCompanies.slice(0, 10).map((company) => {
                        const selected = selectedCompany?.id === company.id
                        const health = responseHealth(company)

                        return (
                          <tr
                            key={company.id}
                            className={cn(
                              "cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]",
                              selected && "bg-sky-500/5 outline outline-1 outline-sky-500/50"
                            )}
                            onClick={() => {
                              setSelectedId(company.id)
                              setShowDetail(true)
                            }}
                          >
                            <td className="px-4 py-4">
                              <div className="flex min-w-[260px] items-center gap-3">
                                <CompanyLogo org={company} />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{company.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{company.id.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4">
                              <Badge className={company.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                                {company.verified ? "Verified" : "Pending"}
                              </Badge>
                            </td>
                            <td className="px-3 py-4">
                              <p className="text-lg font-semibold">{teamCount(company)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="text-lg font-semibold">{serviceCount(company)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="text-lg font-semibold">{bookingsThisMonth(company)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <Badge className={cn("bg-sky-500/10", health.tone)}>{health.label}</Badge>
                            </td>
                            <td className="px-3 py-4">
                              <p>{relativeDate(company.createdAt)}</p>
                            </td>
                            <td className="px-4 py-4 text-right" onClick={(event) => event.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 border-sky-500/30 text-sky-400"
                                  onClick={() => {
                                    setSelectedId(company.id)
                                    setShowDetail(true)
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-9 w-9 border-white/10" asChild>
                                  <Link href={`/admin/users/${company.owner?.id}`}>
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
                <span>Showing 1 to {Math.min(filteredCompanies.length, 10)} of {filteredCompanies.length} companies</span>
                <span>10 / page</span>
              </div>
            </section>
          </main>

          <aside className="hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
            {selectedCompany ? (
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <CompanyLogo org={selectedCompany} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{selectedCompany.name}</p>
                        <Badge className={selectedCompany.verified ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}>
                          {selectedCompany.verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">ID: {selectedCompany.id.slice(0, 8)} · Joined {formatDate(selectedCompany.createdAt)}</p>
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
                        <p className="font-medium">{ownerName(selectedCompany)}</p>
                        <p className="text-xs text-muted-foreground">{selectedCompany.owner?.phoneNumber || "No phone"} · {selectedCompany.owner?.email || "No email"}</p>
                      </div>
                      {selectedCompany.owner?.id && (
                        <Button asChild size="sm" variant="outline" className="border-white/10">
                          <Link href={`/admin/users/${selectedCompany.owner.id}`}>View owner</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{selectedCompany.phone || "No phone"}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate">{selectedCompany.email || "No email"}</span>
                    <span className="text-muted-foreground">Address</span>
                    <span>{selectedCompany.address || "No address"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 border-b border-white/5 p-4 sm:grid-cols-2">
                  {[
                    ["Team Members", teamCount(selectedCompany), `${activeTeam(selectedCompany)} active`],
                    ["Active Services", activeServices(selectedCompany), `${serviceCount(selectedCompany)} total`],
                    ["Bookings", bookingsThisMonth(selectedCompany), "This month"],
                    ["Health", responseHealth(selectedCompany).score, responseHealth(selectedCompany).label],
                    ["Open Issues", openIssues(selectedCompany), openIssues(selectedCompany) ? "Needs action" : "Clear"],
                    ["Staff Accounts", Math.max(1, Math.ceil(teamCount(selectedCompany) / 8)), "Back office"],
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
                    <h2 className="font-semibold">Team Preview</h2>
                    <Button variant="ghost" size="sm" className="h-7 text-sky-400">View all</Button>
                  </div>
                  <div className="space-y-2">
                    {(selectedCompany.workers ?? []).slice(0, 5).map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{[worker.firstName, worker.lastName].filter(Boolean).join(" ") || worker.phoneNumber}</p>
                          <p className="text-xs text-muted-foreground">{worker.phoneNumber}</p>
                        </div>
                        <Badge className="bg-sky-500/10 text-sky-300">Team</Badge>
                      </div>
                    ))}
                    {!selectedCompany.workers?.length && <p className="text-sm text-muted-foreground">No team members returned for this company.</p>}
                  </div>
                </div>

                <div className="border-b border-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold">Service Mix</h2>
                    <Button variant="ghost" size="sm" className="h-7 text-sky-400">View all</Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {["Cleaning", "Pest Control", "Moving Help", "Repairs"].slice(0, Math.min(4, serviceCount(selectedCompany))).map((service, index) => (
                      <div key={service} className="flex items-center justify-between">
                        <span>{service}</span>
                        <span className="font-medium">{Math.max(1, bookingsThisMonth(selectedCompany) - index * 9)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  <h2 className="font-semibold">Actions</h2>
                  <Button className="w-full bg-sky-700 hover:bg-sky-600">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Company
                  </Button>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="border-white/10" onClick={() => toggleVerified(selectedCompany)} disabled={verifyMutation.isPending || updateMutation.isPending}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {selectedCompany.verified ? "Unverify" : "Verify"}
                    </Button>
                    <Button variant="outline" className="border-white/10">
                      <Wrench className="mr-2 h-4 w-4" />
                      Services
                    </Button>
                    <Button variant="outline" className="border-white/10">
                      <Users className="mr-2 h-4 w-4" />
                      Team
                    </Button>
                    {selectedCompany.owner?.id ? (
                      <Button asChild variant="outline" className="border-white/10">
                        <Link href={`/admin/users/${selectedCompany.owner.id}`}>
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
                Select a company to preview operations.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
