"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSignupAttempts, type SignupAttempt } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Loader2, Search, AlertTriangle, Lock, Clock, CheckCircle2, ExternalLink, ArrowUp, ArrowDown } from "lucide-react"
import { formatDate } from "@/lib/utils"

function statusBadge(a: SignupAttempt) {
  switch (a.status) {
    case "registered":
      return <Badge className="gap-1 bg-green-600 hover:bg-green-600"><CheckCircle2 className="h-3 w-3" /> Registered</Badge>
    case "locked":
      return <Badge variant="destructive" className="gap-1"><Lock className="h-3 w-3" /> Locked out</Badge>
    case "failed":
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Failed (timed out)</Badge>
    case "pending":
    default:
      return <Badge variant="outline" className="gap-1">Pending</Badge>
  }
}

type SortKey = "phoneNumber" | "name" | "status" | "codesSent" | "wrongAttempts" | "lastTriedAt"

// Rank statuses by how much they need attention, so a status sort is useful.
const STATUS_RANK: Record<SignupAttempt["status"], number> = {
  locked: 3, pending: 2, failed: 1, registered: 0,
}

function SortableHead({
  label, sortKey, sort, onSort, className,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; dir: "asc" | "desc" }
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 -ml-1 rounded px-1 py-0.5 hover:text-foreground",
          active ? "text-foreground font-medium" : "text-muted-foreground",
        )}
      >
        {label}
        {active && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  )
}

export default function SignupAttemptsPage() {
  const [search, setSearch] = useState("")
  const [showRegistered, setShowRegistered] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "lastTriedAt",
    dir: "desc",
  })

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        // Text columns default to A→Z; numeric/date columns to biggest/newest first.
        : { key, dir: key === "phoneNumber" || key === "name" ? "asc" : "desc" },
    )

  const { data: attempts = [], isLoading, isError, refetch, isFetching } = useQuery<SignupAttempt[]>({
    queryKey: ["signup-attempts"],
    queryFn: getSignupAttempts,
  })

  const counts = useMemo(() => {
    const c = { total: attempts.length, dropoffs: 0, struggling: 0, registered: 0 }
    for (const a of attempts) {
      if (a.status === "registered") c.registered++
      else c.dropoffs++
      if (a.status === "locked" || a.wrongAttempts > 0) c.struggling++
    }
    return c
  }, [attempts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const dir = sort.dir === "asc" ? 1 : -1
    const cmp = (a: SignupAttempt, b: SignupAttempt) => {
      switch (sort.key) {
        case "phoneNumber":
          return dir * a.phoneNumber.localeCompare(b.phoneNumber)
        case "name":
          return dir * (a.name ?? "").localeCompare(b.name ?? "")
        case "status":
          return dir * (STATUS_RANK[a.status] - STATUS_RANK[b.status])
        case "codesSent":
          return dir * (a.codesSent - b.codesSent)
        case "wrongAttempts":
          return dir * (a.wrongAttempts - b.wrongAttempts)
        case "lastTriedAt":
        default:
          return dir * (new Date(a.lastTriedAt ?? 0).getTime() - new Date(b.lastTriedAt ?? 0).getTime())
      }
    }
    return attempts
      .filter((a) => showRegistered || a.status !== "registered")
      .filter((a) => !q || a.phoneNumber.toLowerCase().includes(q) || (a.name ?? "").toLowerCase().includes(q))
      .slice()
      .sort((a, b) => {
        const primary = cmp(a, b)
        if (primary !== 0) return primary
        // Stable tie-breaker: newest attempt first.
        return new Date(b.lastTriedAt ?? 0).getTime() - new Date(a.lastTriedAt ?? 0).getTime()
      })
  }, [attempts, search, showRegistered, sort])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Signup Attempts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Phone numbers that requested a verification code. Those still stuck on OTP are likely worth reaching out to; ones that already registered (perhaps on a later try) are marked so you can skip them.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold">{counts.dropoffs}</p>
          <p className="text-xs text-muted-foreground">Not registered (drop-offs)</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold text-amber-400">{counts.struggling}</p>
          <p className="text-xs text-muted-foreground">Struggled with the code</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-2xl font-bold text-green-500">{counts.registered}</p>
          <p className="text-xs text-muted-foreground">Later registered</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Live data</p>
            <p className="text-sm">Re-check now</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm">Attempts</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn("h-9", showRegistered && "border-green-600/60 text-green-500")}
              onClick={() => setShowRegistered((v) => !v)}
            >
              {showRegistered ? "Hide registered" : "Include registered"}
            </Button>
            <div className="relative w-56 max-w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search phone or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : isError ? (
            <p className="py-16 text-center text-sm text-destructive">Failed to load signup attempts.</p>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {attempts.length === 0 ? "No signup attempts recorded." : "No matches."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Phone" sortKey="phoneNumber" sort={sort} onSort={toggleSort} />
                  <SortableHead label="Name" sortKey="name" sort={sort} onSort={toggleSort} />
                  <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggleSort} />
                  <SortableHead label="Codes sent" sortKey="codesSent" sort={sort} onSort={toggleSort} />
                  <TableHead>Last code</TableHead>
                  <TableHead>Last SMS</TableHead>
                  <SortableHead label="Last tried" sortKey="lastTriedAt" sort={sort} onSort={toggleSort} />
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.phoneNumber}>
                    <TableCell className="font-mono text-sm font-medium whitespace-nowrap">{a.phoneNumber}</TableCell>
                    <TableCell className="text-sm">
                      {a.name || <span className="text-muted-foreground">—</span>}
                      {a.wrongAttempts > 0 && a.status !== "registered" && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> {a.wrongAttempts} wrong
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(a)}</TableCell>
                    <TableCell className="text-sm">{a.codesSent}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {a.lastCode
                        ? <span className="tracking-widest">{a.lastCode}</span>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {a.lastSmsStatus ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={a.lastSmsStatus === "failed" ? "text-destructive" : "text-muted-foreground"}>
                            gateway: {a.lastSmsStatus}{a.lastSmsError ? ` · ${a.lastSmsError}` : ""}
                          </span>
                          <span
                            className={cn(
                              a.lastDeliveryStatus === "delivered" && "text-green-500",
                              (a.lastDeliveryStatus === "failed" ||
                                a.lastDeliveryStatus === "expired" ||
                                a.lastDeliveryStatus === "rejected") && "text-destructive",
                              !a.lastDeliveryStatus && "text-muted-foreground/60",
                            )}
                          >
                            handset: {a.lastDeliveryStatus ?? "no receipt"}
                          </span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {a.lastTriedAt ? formatDate(a.lastTriedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.userId && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/users/${a.userId}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Profile
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
