"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AgencyPlacement,
  getOrganizations,
  getPlacements,
  optOutAgencyWorker,
  Organization,
  updateOrganization,
  updatePlacement,
  verifyOrganization,
} from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import {
  Building2,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react"

function orgTypeLabel(type: string) {
  return type.replace("_", " ")
}

function userName(user?: { firstName: string | null; lastName: string | null; phoneNumber?: string }) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phoneNumber || "Unknown"
}

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [verifiedFilter, setVerifiedFilter] = useState("ALL")
  const [commissionFilter, setCommissionFilter] = useState("ALL")
  const [optOutWorker, setOptOutWorker] = useState<{ id: string; name: string } | null>(null)
  const [optOutReason, setOptOutReason] = useState("")

  const orgParams = {
    ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
    ...(verifiedFilter !== "ALL" ? { verified: verifiedFilter } : {}),
  }

  const { data: orgs, isLoading: loadingOrgs } = useQuery<Organization[]>({
    queryKey: ["admin-organizations", orgParams],
    queryFn: () => getOrganizations(orgParams),
  })

  const { data: placements, isLoading: loadingPlacements } = useQuery<AgencyPlacement[]>({
    queryKey: ["admin-placements", commissionFilter],
    queryFn: () => getPlacements(commissionFilter === "ALL" ? undefined : { commissionPaid: commissionFilter }),
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Organization verified" })
    },
  })

  const orgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Organization updated" })
    },
  })

  const placementMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePlacement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-placements"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Placement updated" })
    },
  })

  const optOutMutation = useMutation({
    mutationFn: () => optOutAgencyWorker(optOutWorker!.id, optOutReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-placements"] })
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] })
      toast({ title: "Worker moved to independent" })
      setOptOutWorker(null)
      setOptOutReason("")
    },
  })

  const filteredOrgs = useMemo(() => {
    return (orgs ?? []).filter((org) => {
      const haystack = `${org.name} ${org.owner?.firstName || ""} ${org.owner?.lastName || ""} ${org.phone || ""} ${org.email || ""}`.toLowerCase()
      return haystack.includes(searchTerm.toLowerCase())
    })
  }, [orgs, searchTerm])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage agencies, service companies, worker rosters, and placement commissions.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search organizations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="PLACEMENT_AGENCY">Placement agencies</SelectItem>
              <SelectItem value="SERVICE_COMPANY">Service companies</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="false">Pending</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="organizations">
        <TabsList>
          <TabsTrigger value="organizations"><Building2 className="w-4 h-4 mr-1.5" />Organizations</TabsTrigger>
          <TabsTrigger value="placements"><DollarSign className="w-4 h-4 mr-1.5" />Placements</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="pt-4">
          {loadingOrgs ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredOrgs.length === 0 ? (
            <Card><CardContent className="py-20 text-center text-muted-foreground">No organizations found.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrgs.map((org) => (
                <Card key={org.id} className={!org.verified ? "border-l-4 border-l-yellow-500" : ""}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{org.name}</h3>
                            <Badge variant="outline">{orgTypeLabel(org.type)}</Badge>
                            <Badge variant={org.verified ? "default" : "secondary"}>{org.verified ? "Verified" : "Pending"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{org.address || "No address"} · Submitted {formatDate(org.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!org.verified && (
                          <Button size="sm" onClick={() => verifyMutation.mutate(org.id)} disabled={verifyMutation.isPending}>
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Verify
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => orgMutation.mutate({ id: org.id, data: { verified: !org.verified } })}>
                          <ShieldCheck className="w-4 h-4 mr-1.5" /> {org.verified ? "Unverify" : "Mark Verified"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/users/${org.owner.id}`}><ExternalLink className="w-4 h-4 mr-1.5" /> Owner</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Owner</p>
                        <p className="font-medium">{userName(org.owner)}</p>
                        <p className="text-muted-foreground">{org.owner.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Contact</p>
                        <p>{org.phone || "—"}</p>
                        <p className="text-muted-foreground">{org.email || "No email"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Operations</p>
                        <p>{org._count?.workers ?? org.workers?.length ?? 0} workers · {org._count?.placements ?? org.placements?.length ?? 0} placements</p>
                        <p className="text-muted-foreground">
                          {(org.placements ?? []).filter((p) => !p.commissionPaid).length} unpaid commissions in recent placements
                        </p>
                      </div>
                    </div>

                    {org.workers?.length ? (
                      <div className="rounded-md border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                          <Users className="w-3.5 h-3.5" /> Agency roster
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {org.workers.slice(0, 10).map((worker) => (
                            <div key={worker.id} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
                              <span>{userName(worker)}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => setOptOutWorker({ id: worker.id, name: userName(worker) })}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="placements" className="pt-4 space-y-4">
          <div className="flex justify-end">
            <Select value={commissionFilter} onValueChange={setCommissionFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All commissions</SelectItem>
                <SelectItem value="false">Unpaid commissions</SelectItem>
                <SelectItem value="true">Paid commissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loadingPlacements ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !placements?.length ? (
            <Card><CardContent className="py-20 text-center text-muted-foreground">No placements found.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {placements.map((placement) => (
                <Card key={placement.id}>
                  <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{userName(placement.worker)}</p>
                        <span className="text-muted-foreground">placed by</span>
                        <p className="font-semibold">{placement.agency.name}</p>
                        <Badge variant={placement.status === "ACTIVE" ? "default" : "secondary"}>{placement.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Employer: {userName(placement.employer)} · Placed {formatDate(placement.placedAt)}
                      </p>
                    </div>
                    <div className="text-sm lg:w-52">
                      <p className="font-medium">{placement.commissionAmount ?? 0} RWF</p>
                      <Badge variant={placement.commissionPaid ? "default" : "destructive"}>
                        {placement.commissionPaid ? "Commission paid" : "Commission unpaid"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => placementMutation.mutate({ id: placement.id, data: { commissionPaid: !placement.commissionPaid } })}
                      >
                        {placement.commissionPaid ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                      {placement.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => placementMutation.mutate({ id: placement.id, data: { status: "TERMINATED" } })}
                        >
                          Terminate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/users/${placement.worker.id}`}>Worker</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!optOutWorker} onOpenChange={(open) => !open && setOptOutWorker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Worker To Independent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This removes {optOutWorker?.name} from their agency and closes active placements as opted out.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={optOutReason} onChange={(e) => setOptOutReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOptOutWorker(null)}>Cancel</Button>
            <Button onClick={() => optOutMutation.mutate()} disabled={!optOutReason.trim() || optOutMutation.isPending}>
              {optOutMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Opt-Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
