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
import { Loader2, Search, AlertTriangle, Lock, Clock, CheckCircle2, ExternalLink } from "lucide-react"
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

export default function SignupAttemptsPage() {
  const [search, setSearch] = useState("")
  const [showRegistered, setShowRegistered] = useState(false)

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
    return attempts
      .filter((a) => showRegistered || a.status !== "registered")
      .filter((a) => !q || a.phoneNumber.toLowerCase().includes(q) || (a.name ?? "").toLowerCase().includes(q))
      .sort((a, b) => {
        // Most in need of help first: locked, then wrong attempts, then recency.
        const score = (x: SignupAttempt) => (x.status === "locked" ? 2 : 0) + (x.wrongAttempts > 0 ? 1 : 0)
        const s = score(b) - score(a)
        if (s !== 0) return s
        return new Date(b.lastTriedAt ?? 0).getTime() - new Date(a.lastTriedAt ?? 0).getTime()
      })
  }, [attempts, search, showRegistered])

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
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Codes sent</TableHead>
                  <TableHead>Last SMS</TableHead>
                  <TableHead>Last tried</TableHead>
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
                    <TableCell className="text-xs">
                      {a.lastSmsStatus ? (
                        <span className={a.lastSmsStatus === "failed" ? "text-destructive" : "text-muted-foreground"}>
                          {a.lastSmsStatus}{a.lastSmsError ? ` · ${a.lastSmsError}` : ""}
                        </span>
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
