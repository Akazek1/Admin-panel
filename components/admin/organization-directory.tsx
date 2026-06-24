"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CheckCircle2, ExternalLink, Loader2, Search, ShieldCheck, Users } from "lucide-react"
import { AdminPageHeader, AdminStatCard, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getOrganizations, Organization, updateOrganization, verifyOrganization } from "@/lib/api"
import { formatDate } from "@/lib/utils"

type OrganizationDirectoryProps = {
  title: string
  singularTitle: string
  description: string
  type: "STAFFING_AGENCY" | "SERVICE_COMPANY"
}

function userName(user?: { firstName: string | null; lastName: string | null; phoneNumber?: string }) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phoneNumber || "Unknown"
}

export function OrganizationDirectory({ title, singularTitle, description, type }: OrganizationDirectoryProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("ALL")

  const params = {
    type,
    ...(verifiedFilter !== "ALL" ? { verified: verifiedFilter } : {}),
  }

  const { data: organizations, isLoading, isError, error } = useQuery<Organization[]>({
    queryKey: ["admin-organizations", params],
    queryFn: () => getOrganizations(params),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: `${singularTitle} verified` })
    },
  })

  const orgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: `${singularTitle} updated` })
    },
  })

  const filteredOrganizations = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return (organizations ?? []).filter((org) => {
      const haystack = `${org.name} ${org.owner?.firstName || ""} ${org.owner?.lastName || ""} ${org.phone || ""} ${org.email || ""}`.toLowerCase()
      return !needle || haystack.includes(needle)
    })
  }, [organizations, searchTerm])

  const verifiedCount = (organizations ?? []).filter((org) => org.verified).length
  const pendingCount = Math.max(0, (organizations ?? []).length - verifiedCount)
  const workerCount = (organizations ?? []).reduce((sum, org) => sum + (org._count?.workers ?? org.workers?.length ?? 0), 0)
  const placementCount = (organizations ?? []).reduce((sum, org) => sum + (org._count?.placements ?? org.placements?.length ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader title={title} description={description} />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard title={`Total ${title}`} value={(organizations ?? []).length.toLocaleString()} description="Registered organizations" icon={Building2} tone="green" />
          <AdminStatCard title="Verified" value={verifiedCount.toLocaleString()} description="Approved to operate" icon={ShieldCheck} tone="blue" />
          <AdminStatCard title="Pending" value={pendingCount.toLocaleString()} description="Awaiting review" icon={CheckCircle2} tone="amber" />
          <AdminStatCard title={type === "STAFFING_AGENCY" ? "Workers / Placements" : "Workers / Services"} value={`${workerCount} / ${placementCount}`} description="Operational footprint" icon={Users} tone="purple" />
        </div>

        <div className="rounded-lg border border-white/5 bg-card/70 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 border-white/10 bg-background/70 pl-9"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="h-10 border-white/10 bg-background/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <EmptyState
            title={`Could not load ${title.toLowerCase()}`}
            description={(error as any)?.response?.data?.message || (error as Error)?.message || "Please refresh or check the backend connection."}
            icon={Building2}
          />
        ) : filteredOrganizations.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} found`} description="Adjust the search or status filter to widen the result set." icon={Building2} />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredOrganizations.map((org) => (
              <Card key={org.id} className="border-white/5 bg-card/70">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold">{org.name}</h2>
                          <Badge variant={org.verified ? "default" : "secondary"} className={org.verified ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15" : ""}>
                            {org.verified ? "Verified" : "Pending"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{org.address || "No address"} · Submitted {formatDate(org.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!org.verified ? (
                        <Button size="sm" onClick={() => verifyMutation.mutate(org.id)} disabled={verifyMutation.isPending}>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Verify
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" onClick={() => orgMutation.mutate({ id: org.id, data: { verified: !org.verified } })}>
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {org.verified ? "Unverify" : "Mark Verified"}
                      </Button>
                      {org.owner?.id ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/users/${org.owner.id}`}>
                            <ExternalLink className="mr-1.5 h-4 w-4" />
                            Owner
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner</p>
                      <p className="mt-1 font-medium">{userName(org.owner)}</p>
                      <p className="text-muted-foreground">{org.owner?.phoneNumber || "No phone"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
                      <p className="mt-1">{org.phone || "No phone"}</p>
                      <p className="text-muted-foreground">{org.email || "No email"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operations</p>
                      <p className="mt-1">{org._count?.workers ?? org.workers?.length ?? 0} workers</p>
                      <p className="text-muted-foreground">{org._count?.placements ?? org.placements?.length ?? 0} placements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
