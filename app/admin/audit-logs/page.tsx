"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, History, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { formatDate } from "@/lib/utils"

const TARGET_TYPES = ["user", "booking", "report", "verificationRequest", "category", "organization", "review", "heroBanner", "announcement"]

interface Filters {
  action: string
  targetType: string
  actorId: string
  from: string
  to: string
}

const emptyFilters = (): Filters => ({ action: "", targetType: "", actorId: "", from: "", to: "" })

function actionBadge(action: string) {
  if (action.includes("approve") || action.includes("verify") || action.includes("create") || action.includes("send"))
    return <Badge className="bg-green-600 font-mono text-[10px]">{action}</Badge>
  if (action.includes("reject") || action.includes("delete") || action.includes("ban") || action.includes("remove"))
    return <Badge variant="destructive" className="font-mono text-[10px]">{action}</Badge>
  return <Badge variant="outline" className="font-mono text-[10px]">{action}</Badge>
}

async function fetchLogs(page: number, limit: number, filters: Filters) {
  const params: Record<string, string> = { page: String(page), limit: String(limit) }
  if (filters.action) params.action = filters.action
  if (filters.targetType) params.targetType = filters.targetType
  if (filters.actorId) params.actorId = filters.actorId
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  const res = await axiosInstance.get("/admin/audit-logs", { params })
  return res.data?.data ?? res.data
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(emptyFilters())
  const [applied, setApplied] = useState<Filters>(emptyFilters())
  const limit = 25

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", page, applied],
    queryFn: () => fetchLogs(page, limit, applied),
  })

  const apply = () => {
    setPage(1)
    setApplied({ ...filters })
  }

  const clear = () => {
    setFilters(emptyFilters())
    setApplied(emptyFilters())
    setPage(1)
  }

  const hasFilters = Object.values(applied).some(Boolean)
  const logs = data?.data ?? []
  const meta = data?.meta ?? { lastPage: 1, total: 0 }

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-full">
            <History className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
        </div>
        <p className="text-sm text-muted-foreground italic">Accountability trail for all admin actions.</p>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Action contains</Label>
              <Input
                placeholder="e.g. ban, verify, delete"
                value={filters.action}
                onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && apply()}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target type</Label>
              <Select value={filters.targetType || "__all"} onValueChange={v => setFilters(f => ({ ...f, targetType: v === "__all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All types</SelectItem>
                  {TARGET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From date</Label>
              <Input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To date</Label>
              <Input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <div className="space-y-1 flex-1 mr-4">
              <Label className="text-xs">Actor ID (admin user ID)</Label>
              <Input
                placeholder="Paste admin user ID to filter by person"
                value={filters.actorId}
                onChange={e => setFilters(f => ({ ...f, actorId: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && apply()}
              />
            </div>
            <div className="flex gap-2 mt-5">
              {hasFilters && (
                <Button variant="outline" onClick={clear}>
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
              <Button onClick={apply}>
                <Search className="w-4 h-4 mr-2" /> Search
              </Button>
            </div>
          </div>
          {hasFilters && (
            <p className="text-xs text-primary mt-2">Filters active — showing filtered results</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Target ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium text-sm whitespace-nowrap">
                        {log.actor?.firstName} {log.actor?.lastName}
                      </TableCell>
                      <TableCell>{actionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="text-xs uppercase font-bold text-muted-foreground">
                          {log.targetType}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground max-w-[120px] truncate">
                        {log.targetId}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{meta.total.toLocaleString()} total entries</p>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="text-sm font-medium px-2">Page {page} of {meta.lastPage}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page >= meta.lastPage}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
