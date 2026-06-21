"use client"

import React, { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  CheckCircle2,
  Columns3,
  Eye,
  Filter,
  Flag,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react"
import { AdminPageHeader, AdminStatCard, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAllUsers, User } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 25, 50]

type SortKey = "individual" | "provider" | "verification" | "status" | "reports" | "bookings" | "lastActive" | "joined"
type SortDirection = "asc" | "desc"

function userName(user: User) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phoneNumber || "Unnamed User"
}

function initials(user: User) {
  const name = userName(user)
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatShortDate(value?: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function relativeTime(value?: string | null) {
  if (!value) return "-"
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function hasRole(user: User, role: string) {
  return Array.isArray(user.roles) && user.roles.includes(role)
}

function isIndividual(user: User) {
  const organizationRoles = ["COMPANY", "STAFFING_AGENCY", "AGENCY", "PLACEMENT_AGENCY"]
  const isStaff = hasRole(user, "ADMIN") || hasRole(user, "SUB_ADMIN") || user.isAdmin
  const isOrganizationAccount =
    user.accountType === "COMPANY" ||
    user.accountType === "STAFFING_AGENCY" ||
    organizationRoles.some((role) => hasRole(user, role))

  return !isStaff && !isOrganizationAccount
}

function isProvider(user: User) {
  return user.isProvider ?? hasRole(user, "WORKER")
}

function isVerified(user: User) {
  return user.isVerified || user.governmentIdStatus === "VERIFIED"
}

function bookingCount(user: User) {
  return (
    user._count?.bookingsAsWorker ??
    0
  ) + (
    user._count?.bookingsAsEmployer ??
    0
  ) || (user.bookingsAsWorker?.length ?? 0) + (user.bookingsAsEmployer?.length ?? 0)
}

function reportCount(user: User) {
  return user._count?.reportsReceived ?? user.reportsReceived?.length ?? 0
}

function timeValue(value?: string | null) {
  return value ? new Date(value).getTime() || 0 : 0
}

function sortValue(user: User, sortKey: SortKey) {
  if (sortKey === "individual") return userName(user).toLowerCase()
  if (sortKey === "provider") return Number(isProvider(user))
  if (sortKey === "verification") return Number(isVerified(user))
  if (sortKey === "status") return Number(user.isBanned)
  if (sortKey === "reports") return reportCount(user)
  if (sortKey === "bookings") return bookingCount(user)
  if (sortKey === "lastActive") return timeValue(user.lastActiveAt || user.updatedAt || user.createdAt)
  return timeValue(user.createdAt)
}

function compareUsers(a: User, b: User, sortKey: SortKey, direction: SortDirection) {
  const aValue = sortValue(a, sortKey)
  const bValue = sortValue(b, sortKey)
  const modifier = direction === "asc" ? 1 : -1

  if (typeof aValue === "string" && typeof bValue === "string") {
    return aValue.localeCompare(bValue) * modifier
  }

  return ((aValue as number) - (bValue as number)) * modifier
}

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: SortKey
  activeSortKey: SortKey
  direction: SortDirection
  onSort: (sortKey: SortKey) => void
}) {
  const active = activeSortKey === sortKey
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground"
      )}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

export default function IndividualsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [verificationFilter, setVerificationFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [providerFilter, setProviderFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>("joined")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const { data: users, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAllUsers,
    staleTime: 5 * 60 * 1000,
  })

  const individuals = useMemo(() => (users ?? []).filter(isIndividual), [users])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    return individuals.filter((user) => {
      const haystack = `${userName(user)} ${user.phoneNumber || ""} ${user.email || ""} ${user.username || ""} ${user.id}`.toLowerCase()
      const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch)
      const matchesVerification =
        verificationFilter === "ALL" ||
        (verificationFilter === "VERIFIED" && isVerified(user)) ||
        (verificationFilter === "PENDING" && !isVerified(user))
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !user.isBanned) ||
        (statusFilter === "BANNED" && user.isBanned)
      const matchesProvider =
        providerFilter === "ALL" ||
        (providerFilter === "YES" && isProvider(user)) ||
        (providerFilter === "NO" && !isProvider(user))

      return matchesSearch && matchesVerification && matchesStatus && matchesProvider
    })
  }, [individuals, deferredSearchTerm, verificationFilter, statusFilter, providerFilter])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => compareUsers(a, b, sortKey, sortDirection))
  }, [filteredUsers, sortKey, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sortedUsers.length / pageSize))
  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedUsers.slice(start, start + pageSize)
  }, [sortedUsers, currentPage, pageSize])

  const stats = useMemo(() => {
    const providers = individuals.filter(isProvider).length
    const verified = individuals.filter(isVerified).length
    const banned = individuals.filter((user) => user.isBanned).length
    const reports = individuals.reduce((sum, user) => sum + reportCount(user), 0)

    return {
      total: individuals.length,
      providers,
      verified,
      pending: Math.max(0, individuals.length - verified),
      banned,
      reports,
    }
  }, [individuals])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchTerm, verificationFilter, statusFilter, providerFilter, pageSize])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  const allVisibleSelected =
    visibleUsers.length > 0 && visibleUsers.every((user) => selectedIds.includes(user.id))

  const toggleVisibleUsers = (checked: boolean) => {
    const visibleIds = visibleUsers.map((user) => user.id)
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...visibleIds]))
        : prev.filter((id) => !visibleIds.includes(id))
    )
  }

  const toggleUser = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? Array.from(new Set([...prev, id])) : prev.filter((selectedId) => selectedId !== id))
  }

  const clearSelectionAndFilters = () => {
    setSearchTerm("")
    setVerificationFilter("ALL")
    setStatusFilter("ALL")
    setProviderFilter("ALL")
    setSelectedIds([])
  }

  const handleSort = (nextSortKey: SortKey) => {
    setCurrentPage(1)

    if (nextSortKey === sortKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc")
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(nextSortKey === "individual" ? "asc" : "desc")
  }

  const handleSortSelect = (value: string) => {
    const [nextSortKey, nextDirection] = value.split(":") as [SortKey, SortDirection]
    setCurrentPage(1)
    setSortKey(nextSortKey)
    setSortDirection(nextDirection)
  }

  const firstItem = sortedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, sortedUsers.length)

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Individuals"
          description="Manage and monitor individual marketplace users."
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard title="Total Individuals" value={stats.total.toLocaleString()} description="Marketplace users" icon={Users} tone="green" />
          <AdminStatCard title="Providers" value={stats.providers.toLocaleString()} description="Can offer services" icon={ShieldCheck} tone="blue" />
          <AdminStatCard title="Pending Verification" value={stats.pending.toLocaleString()} description="Needs attention" icon={CheckCircle2} tone="amber" />
          <AdminStatCard title="Banned / Suspended" value={stats.banned.toLocaleString()} description="Restricted accounts" icon={Ban} tone="red" />
          <AdminStatCard title="With Reports" value={stats.reports.toLocaleString()} description="Total report signals" icon={Flag} tone="purple" />
        </div>

        <div className="rounded-lg border border-white/5 bg-card/70 p-4 shadow-sm shadow-black/10">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_160px_150px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone or ID..."
                className="h-10 border-white/10 bg-background/70 pl-9"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="h-10 border-white/10 bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All verification</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 border-white/10 bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="h-10 border-white/10 bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All providers</SelectItem>
                <SelectItem value="YES">Provider: Yes</SelectItem>
                <SelectItem value="NO">Provider: No</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 border-white/10 bg-background/70">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="ghost" className="h-10 text-red-400 hover:text-red-300" onClick={clearSelectionAndFilters}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-white/5 bg-card/70 shadow-sm shadow-black/10">
          <div className="flex flex-col gap-3 border-b border-white/5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={(value) => toggleVisibleUsers(!!value)}
                aria-label="Select visible individuals"
              />
              <span className="text-sm font-medium text-muted-foreground">{selectedIds.length} selected</span>
              <Button size="sm" variant="outline" className="border-white/10 bg-background/60" disabled={!selectedIds.length}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 bg-background/60" disabled={!selectedIds.length}>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-background/60">
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
              </Button>
              <Select value={`${sortKey}:${sortDirection}`} onValueChange={handleSortSelect}>
                <SelectTrigger className="h-9 w-[210px] border-white/10 bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joined:desc">Sort by: Joined newest</SelectItem>
                  <SelectItem value="joined:asc">Sort by: Joined oldest</SelectItem>
                  <SelectItem value="lastActive:desc">Sort by: Last active</SelectItem>
                  <SelectItem value="individual:asc">Sort by: Name A-Z</SelectItem>
                  <SelectItem value="individual:desc">Sort by: Name Z-A</SelectItem>
                  <SelectItem value="reports:desc">Sort by: Most reports</SelectItem>
                  <SelectItem value="bookings:desc">Sort by: Most bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">Could not load individuals</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {(error as any)?.response?.data?.message || (error as Error)?.message || "Please refresh or check the backend connection."}
              </p>
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No individuals found" description="Adjust the filters or search term to widen the result set." icon={Users} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-10">
                    <span className="sr-only">Select</span>
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Individual" sortKey="individual" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Provider" sortKey="provider" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Verification" sortKey="verification" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Status" sortKey="status" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Reports" sortKey="reports" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Bookings" sortKey="bookings" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Last Active" sortKey="lastActive" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHead label="Joined" sortKey="joined" activeSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => {
                  const reports = reportCount(user)
                  const bookings = bookingCount(user)
                  const lastActive = user.lastActiveAt || user.updatedAt || user.createdAt

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer border-white/5 hover:bg-white/[0.03]"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(user.id)}
                          onCheckedChange={(value) => toggleUser(user.id, !!value)}
                          aria-label={`Select ${userName(user)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[240px] items-center gap-3">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground ring-1 ring-white/10">
                              {initials(user)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{userName(user)}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.phoneNumber || user.email || user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isProvider(user) ? "default" : "secondary"} className={isProvider(user) ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15" : ""}>
                          {isProvider(user) ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={isVerified(user) ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-300"}>
                          {isVerified(user) ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isBanned ? "destructive" : "outline"} className={!user.isBanned ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : ""}>
                          {user.isBanned ? "Banned" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className={reports > 0 ? "font-medium text-red-400" : "text-emerald-400"}>{reports}</TableCell>
                      <TableCell className="font-medium text-emerald-400">{bookings}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {relativeTime(lastActive)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatShortDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => router.push(`/admin/users/${user.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col gap-3 border-t border-white/5 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {firstItem} to {lastItem} of {sortedUsers.length.toLocaleString()} individuals
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="icon" variant="outline" className="h-9 w-9 border-white/10 bg-background/60" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                <span className="sr-only">Previous page</span>
                {"<"}
              </Button>
              <div className="flex h-9 min-w-9 items-center justify-center rounded-md border border-primary/50 px-3 text-sm text-primary">
                {currentPage}
              </div>
              <Button size="icon" variant="outline" className="h-9 w-9 border-white/10 bg-background/60" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount}>
                <span className="sr-only">Next page</span>
                {">"}
              </Button>
              <span className="px-2 text-sm text-muted-foreground">of {pageCount}</span>
              <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                <SelectTrigger className="h-9 w-[110px] border-white/10 bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>{option} / page</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
