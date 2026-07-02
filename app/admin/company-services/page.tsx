"use client"

import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Check,
  ClipboardCheck,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react"
import type { CompanyService, ServiceApprovalStatus } from "@/lib/api"
import {
  approveCompanyService,
  getCompanyServices,
  rejectCompanyService,
} from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { cn, formatDate } from "@/lib/utils"

const STATUS_META: Record<ServiceApprovalStatus, { label: string; cls: string }> = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-700" },
}

function priceLabel(s: CompanyService) {
  const fmt = (n: number | null) => (n != null ? `RWF ${n.toLocaleString()}` : null)
  const min = fmt(s.priceMin)
  const max = fmt(s.priceMax)
  if (min && max) return `${min} – ${max}`
  return min || max || "Negotiable"
}

export default function CompanyServicesPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ServiceApprovalStatus>("PENDING")

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["company-services", status],
    queryFn: () => getCompanyServices(status),
  })

  const services = data ?? []

  const approve = useMutation({
    mutationFn: (id: string) => approveCompanyService(id),
    onSuccess: () => {
      toast({ title: "Service approved", description: "It is now visible in the marketplace." })
      queryClient.invalidateQueries({ queryKey: ["company-services"] })
    },
    onError: () => toast({ title: "Could not approve", variant: "destructive" }),
  })

  const reject = useMutation({
    mutationFn: (id: string) => rejectCompanyService(id),
    onSuccess: () => {
      toast({ title: "Service rejected", description: "The company can edit and resubmit it." })
      queryClient.invalidateQueries({ queryKey: ["company-services"] })
    },
    onError: () => toast({ title: "Could not reject", variant: "destructive" }),
  })

  const pendingId =
    approve.isPending ? approve.variables : reject.isPending ? reject.variables : null

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
            <ClipboardCheck className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Company services</h1>
            <p className="text-sm text-gray-500">
              Review service cards listed by Service Companies.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as ServiceApprovalStatus)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <p className="font-semibold text-gray-700">No {STATUS_META[status].label.toLowerCase()} services</p>
          <p className="mt-1 text-sm text-gray-500">Nothing to review in this bucket right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((s) => {
            const busy = pendingId === s.id
            return (
              <li
                key={s.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-gray-900">{s.category?.name}</span>
                      <Badge className={cn("border-0", STATUS_META[s.approvalStatus].cls)}>
                        {STATUS_META[s.approvalStatus].label}
                      </Badge>
                      {!s.isActive && (
                        <Badge className="border-0 bg-gray-100 text-gray-500">Inactive</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-600">
                      <span className="flex items-center gap-1.5 font-medium text-gray-800">
                        <Building2 className="h-3.5 w-3.5" />
                        {s.company?.name || "Unknown company"}
                        {s.company?.verified ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-amber-600">(unverified)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> {priceLabel(s)}
                      </span>
                      {s.serviceAreas && s.serviceAreas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {s.serviceAreas.join(", ")}
                        </span>
                      )}
                    </div>

                    {s.description && (
                      <p className="max-w-2xl text-[13px] text-gray-500">{s.description}</p>
                    )}
                    <p className="text-[11px] text-gray-400">Submitted {formatDate(s.createdAt)}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {s.approvalStatus !== "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => approve.mutate(s.id)}
                        disabled={busy}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {busy && approve.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-1 h-4 w-4" /> Approve
                          </>
                        )}
                      </Button>
                    )}
                    {s.approvalStatus !== "REJECTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reject.mutate(s.id)}
                        disabled={busy}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        {busy && reject.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="mr-1 h-4 w-4" /> Reject
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
