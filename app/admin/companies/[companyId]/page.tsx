"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getOrganizationDetail, updateOrganization, verifyOrganization, deleteOrganization } from "@/lib/api"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CopyableText } from "@/components/admin/copyable-text"
import { formatDate } from "@/lib/utils"
import {
  ArrowLeft, ShieldCheck, Edit, Save, X, Loader2,
  Mail, Phone, Calendar, CheckCircle2, AlertCircle,
  Briefcase, Building2, Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

async function resetOrgPassword(id: string) {
  const res = await axiosInstance.post(`/admin/organizations/${id}/reset-password`)
  return res.data?.data ?? res.data
}

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const { data: org, isLoading, isError } = useQuery({
    queryKey: ["admin-org", companyId],
    queryFn: () => getOrganizationDetail(companyId),
    enabled: !!companyId,
  })

  const saveMutation = useMutation({
    mutationFn: () => updateOrganization(companyId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-org", companyId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setEditing(false)
      toast({ title: "Company updated" })
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e?.response?.data?.message ?? e.message, variant: "destructive" })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: () => (org?.verified ? updateOrganization(companyId, { verified: false }) : verifyOrganization(companyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-org", companyId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: org?.verified ? "Company unverified" : "Company verified" })
    },
  })

  const resetPassMutation = useMutation({
    mutationFn: () => resetOrgPassword(companyId),
    onSuccess: (data) => {
      setTempPassword(data.tempPassword)
      toast({ title: "Password reset — share the temp password with the company" })
    },
    onError: (e: any) => {
      toast({ title: "Reset failed", description: e?.response?.data?.message ?? e.message, variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(companyId, deleteConfirm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      toast({ title: "Company deleted" })
      router.push("/admin/companies")
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e?.response?.data?.message ?? e.message, variant: "destructive" })
    },
  })

  const startEditing = () => {
    setForm({
      name: org?.name ?? "",
      loginEmail: org?.loginEmail ?? "",
      phone: org?.phone ?? "",
      description: org?.description ?? "",
      address: org?.address ?? "",
    })
    setEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-10 w-10" />
        <p>Company not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const isVerified = org.verified ?? false
  const serviceCount = org._count?.services ?? org.services?.length ?? 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/companies"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold ring-1 ring-white/10">
                {(org.name ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold leading-tight">{org.name}</h1>
              <p className="text-xs text-muted-foreground">{org.type === "SERVICE_COMPANY" ? "Service Company" : "Staffing Agency"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saveMutation.isPending}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                Save
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit className="mr-1.5 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — identity + actions */}
        <div className="space-y-4 lg:col-span-1">

          {/* Verification card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  )}
                  <span className="text-sm font-medium">{isVerified ? "Verified" : "Pending verification"}</span>
                </div>
                <Badge variant="outline" className={cn(
                  isVerified ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                )}>
                  {isVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <Button
                variant={isVerified ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                {verifyMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                {isVerified ? "Unverify account" : "Verify account"}
              </Button>
              <p className="text-xs text-muted-foreground">
                {isVerified
                  ? "This company is approved and can list services on the marketplace."
                  : "Verifying allows this company to list services on the marketplace."}
              </p>
            </CardContent>
          </Card>

          {/* Key info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <CopyableText value={org.id} label="Org ID" className="text-xs text-muted-foreground font-mono" />
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <CopyableText value={org.phone ?? "—"} label="Phone" className="text-xs text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{org.loginEmail ?? org.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">Joined {formatDate(org.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">{serviceCount} service{serviceCount !== 1 ? "s" : ""} listed</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-900/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-red-400 uppercase tracking-wide">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full border-white/10" onClick={() => resetPassMutation.mutate()} disabled={resetPassMutation.isPending}>
                {resetPassMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Reset password
              </Button>
              {tempPassword && (
                <div className="rounded bg-muted px-3 py-2 text-xs font-mono">
                  Temp password: <span className="font-bold text-amber-300">{tempPassword}</span>
                </div>
              )}
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right column — editable profile + services */}
        <div className="space-y-4 lg:col-span-2">

          {/* Editable profile */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Business name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Login email</Label>
                    <Input type="email" value={form.loginEmail} onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                  </div>
                </>
              ) : (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Business name</dt>
                    <dd className="font-medium">{org.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Login email</dt>
                    <dd>{org.loginEmail ?? org.email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Phone</dt>
                    <dd>{org.phone ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Description</dt>
                    <dd className="text-muted-foreground whitespace-pre-wrap">{org.description ?? <span className="italic opacity-50">No description</span>}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">Address</dt>
                    <dd>{org.address ?? <span className="italic opacity-50 text-muted-foreground">Not set</span>}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Services ({serviceCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!org.services || org.services.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No services listed yet.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {org.services.map((svc: any) => (
                    <div key={svc.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{svc.title}</p>
                        <p className="text-xs text-muted-foreground">{svc.category?.name ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {svc.priceMin ? (
                          <span className="text-xs text-emerald-400">
                            {svc.priceMin.toLocaleString()}
                            {svc.priceMax ? `–${svc.priceMax.toLocaleString()}` : ""} RWF
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Price on request</span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            svc.approvalStatus === "APPROVED"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : svc.approvalStatus === "PENDING"
                              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                              : "border-red-500/20 bg-red-500/10 text-red-300",
                          )}
                        >
                          {svc.approvalStatus}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", svc.isActive ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-muted-foreground")}>
                          {svc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete company account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently deletes <strong>{org.name}</strong> and frees its phone and email.
            Type the company name exactly to confirm.
          </p>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={org.name}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== org.name || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
