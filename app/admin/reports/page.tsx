"use client"

import React, { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getReports, resolveReport, Report } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, CheckCircle, Eye, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"

const PAGE_SIZE = 50

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolutionStatus, setResolutionStatus] = useState<string>("")
  const [resolutionNote, setResolutionNote] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: getReports,
    staleTime: 2 * 60 * 1000,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note: string }) =>
      resolveReport(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] })
      toast({ title: "Report Updated", description: "The report status has been updated." })
      setSelectedReport(null)
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

  const handleResolve = () => {
    if (selectedReport && resolutionStatus && resolutionNote.trim()) {
      resolveMutation.mutate({
        id: selectedReport.id,
        status: resolutionStatus,
        note: resolutionNote,
      })
    } else {
      toast({ title: "Missing Information", description: "Please provide both status and note." })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      case "REVIEWING":
        return <Badge variant="default" className="bg-blue-600">Reviewing</Badge>
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-600">Resolved</Badge>
      case "DISMISSED":
        return <Badge variant="outline">Dismissed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredReports = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
    return (reports ?? []).filter((report) => {
      const searchStr = `${report.reporter.firstName || ""} ${report.reporter.lastName || ""} ${report.target.firstName || ""} ${report.target.lastName || ""} ${report.reason}`.toLowerCase()
      const matchesSearch = !normalizedSearch || searchStr.includes(normalizedSearch)
      const matchesStatus = statusFilter === "ALL" || report.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reports, deferredSearchTerm, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE))
  const visibleReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredReports.slice(start, start + PAGE_SIZE)
  }, [filteredReports, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [deferredSearchTerm, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  const allVisibleSelected =
    visibleReports.length > 0 && visibleReports.every((report) => selectedIds.includes(report.id))
  const toggleVisible = (checked: boolean) => {
    const ids = visibleReports.map((report) => report.id)
    setSelectedIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold">User Reports</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWING">Reviewing</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="px-3 py-1">
            {filteredReports.filter((r) => r.status === "PENDING").length} New
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(value) => toggleVisible(!!value)}
            aria-label="Select visible reports"
          />
          Select visible
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
            Review Selected
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No reports found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Reporter</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(report.id)}
                        onCheckedChange={(value) =>
                          setSelectedIds((prev) =>
                            value ? Array.from(new Set([...prev, report.id])) : prev.filter((id) => id !== report.id)
                          )
                        }
                        aria-label={`Select report ${report.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {report.reporter.firstName} {report.reporter.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{report.reporter.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {report.target.firstName} {report.target.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{report.target.phoneNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.reason}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-sm">{formatDate(report.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReport(report)
                          setResolutionStatus(report.status)
                          setResolutionNote(report.reviewNote || "")
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredReports.length > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border bg-muted/20 px-4 py-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {visibleReports.length} of {filteredReports.length} reports · page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Reporter</p>
                  <p className="font-semibold">
                    {selectedReport.reporter.firstName} {selectedReport.reporter.lastName}
                  </p>
                  <p className="text-sm">{selectedReport.reporter.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold text-red-600">
                    Target User
                  </p>
                  <p className="font-semibold">
                    {selectedReport.target.firstName} {selectedReport.target.lastName}
                  </p>
                  <p className="text-sm">{selectedReport.target.phoneNumber}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold">Reported Reason: {selectedReport.reason}</p>
                <div className="p-3 bg-white border rounded-md text-sm italic">
                  "{selectedReport.description || "No additional details provided."}"
                </div>
              </div>

              {selectedReport.evidence.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold">Evidence</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.evidence.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block border rounded overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt="Evidence" className="w-full h-32 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr />

              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Resolution
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Change Status</label>
                  <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REVIEWING">Reviewing</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="DISMISSED">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Internal Note / Action Taken</label>
                  <Textarea
                    placeholder="Describe the action taken or your findings..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                  />
                </div>

                {selectedReport.reviewer && (
                  <p className="text-xs text-muted-foreground italic">
                    Last updated by {selectedReport.reviewer.firstName} on {formatDate(selectedReport.reviewedAt!)}
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={handleResolve}
                  disabled={resolveMutation.isPending}
                >
                  {resolveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Save Resolution
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
