"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAuditLogs, AuditLog } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, History, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs", page],
    queryFn: () => getAuditLogs(page, limit),
  })

  const getActionBadge = (action: string) => {
    if (action.includes("approve") || action.includes("verify") || action.includes("create")) {
      return <Badge className="bg-green-600 font-mono text-[10px]">{action}</Badge>
    }
    if (action.includes("reject") || action.includes("delete") || action.includes("ban")) {
      return <Badge variant="destructive" className="font-mono text-[10px]">{action}</Badge>
    }
    return <Badge variant="outline" className="font-mono text-[10px]">{action}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const logs = data?.data || []
  const meta = data?.meta || { lastPage: 1, total: 0 }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-full">
            <History className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
        </div>
        <div className="text-sm text-muted-foreground italic">
          Accountability trail for all administrative actions.
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Type</TableHead>
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
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.actor.firstName} {log.actor.lastName}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs uppercase font-bold text-muted-foreground">
                        {log.targetType}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">
                      {log.targetId}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Total {meta.total} actions logged
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <div className="flex items-center px-4 text-sm font-medium">
                Page {page} of {meta.lastPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                disabled={page === meta.lastPage}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
