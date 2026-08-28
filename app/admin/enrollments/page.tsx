"use client"

import React, { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, RefreshCw, Search, UserCheck, UserMinus, Building2 } from "lucide-react"
import {
  AgencyEnrollment,
  EnrollmentStatus,
  endEnrollment,
  getEnrollments,
  optOutAgencyEnrollments,
  optOutWorkerEnrollments,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "DECLINED", label: "Declined" },
  { value: "OPTED_OUT", label: "Opted out" },
  { value: "REVOKED", label: "Revoked" },
]

function statusVariant(status: EnrollmentStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "INVITED":
      return "secondary"
    case "OPTED_OUT":
    case "REVOKED":
    case "DECLINED":
      return "outline"
    default:
      return "outline"
  }
}

function workerName(e: AgencyEnrollment) {
  return [e.worker?.firstName, e.worker?.lastName].filter(Boolean).join(" ") || "Unknown worker"
}

// A confirm action that ends either a single enrollment, a whole agency, or a
// whole worker — the target is resolved by the caller.
type PendingAction =
  | { kind: "enrollment"; id: string; label: string }
  | { kind: "agency"; id: string; label: string }
  | { kind: "worker"; id: string; label: string }

export default function EnrollmentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<string>("ALL")
  const [search, setSearch] = useState("")
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState("")

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-enrollments", status],
    queryFn: () => getEnrollments(status === "ALL" ? {} : { status }),
  })

  const enrollments = data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return enrollments
    return enrollments.filter((e) =>
      [workerName(e), e.agency?.name, e.service?.title]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [enrollments, search])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] })

  const mutation = useMutation({
    mutationFn: async (action: PendingAction) => {
      if (action.kind === "enrollment") return endEnrollment(action.id, reason || undefined)
      if (action.kind === "agency") return optOutAgencyEnrollments(action.id, reason || undefined)
      return optOutWorkerEnrollments(action.id, reason || undefined)
    },
    onSuccess: () => {
      toast({ title: "Done", description: "Enrollment(s) opted out. They can now re-enroll." })
      setPending(null)
      setReason("")
      invalidate()
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err?.response?.data?.message ?? "Could not complete the request.",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <UserCheck className="h-5 w-5" /> Agency Enrollments
          </h1>
          <p className="text-sm text-muted-foreground">
            Service-level affiliations between workers and agencies. Opt a worker or an
            entire agency out here — they can re-enroll afterwards.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search worker, agency, or service…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Worker</th>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Agency</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Invited</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => {
                const live = e.status === "INVITED" || e.status === "ACTIVE"
                return (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{workerName(e)}</td>
                    <td className="px-4 py-3">{e.service?.title ?? "—"}</td>
                    <td className="px-4 py-3">{e.agency?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(e.invitedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!live}
                          onClick={() => setPending({ kind: "enrollment", id: e.id, label: `${workerName(e)} · ${e.service?.title ?? "service"}` })}
                        >
                          End
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPending({ kind: "worker", id: e.workerId, label: workerName(e) })}
                        >
                          <UserMinus className="mr-1 h-3.5 w-3.5" /> Opt out worker
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPending({ kind: "agency", id: e.agencyId, label: e.agency?.name ?? "agency" })}
                        >
                          <Building2 className="mr-1 h-3.5 w-3.5" /> Opt out agency
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

      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) { setPending(null); setReason("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "enrollment" && "End this enrollment?"}
              {pending?.kind === "worker" && "Opt this worker out of all agencies?"}
              {pending?.kind === "agency" && "Opt this entire agency out?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "enrollment" && (
                <>This ends the enrollment for <b>{pending?.label}</b>. They can re-enroll afterwards.</>
              )}
              {pending?.kind === "worker" && (
                <>This ends every live enrollment for <b>{pending?.label}</b> and clears any legacy agency link. They can re-enroll afterwards.</>
              )}
              {pending?.kind === "agency" && (
                <>This ends every live enrollment for <b>{pending?.label}</b> and clears all its legacy worker links. Everyone can re-enroll afterwards.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => { ev.preventDefault(); if (pending) mutation.mutate(pending) }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
