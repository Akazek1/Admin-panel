"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, KeyRound, Link2, Loader2, Pause, Play, Save, SlidersHorizontal, Trash2 } from "lucide-react"
import { EmptyState } from "@/components/admin/admin-primitives"
import {
  ClientLinkDialog,
  ExtrasDialog,
  RemoveStaffDialog,
  TemporaryPasswordDialog,
  fullName,
} from "@/components/admin/staff-dialogs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { useAdminAccess } from "@/lib/admin-access"
import {
  apiError,
  getPermissionCatalog,
  getRoles,
  getStaffMember,
  pauseStaff,
  resetStaffPassword,
  resumeStaff,
  setStaffRole,
  updateStaff,
  type StaffMember,
} from "@/lib/staff-api"

type Form = { firstName: string; lastName: string; email: string; staffTitle: string }

// Readable labels for the audit actions shown in a person's activity.
const ACTION_LABELS: Record<string, string> = {
  "staff.create": "Staff account created",
  "staff.add": "Made staff",
  "staff.update": "Details edited",
  "staff.role_change": "Role changed",
  "staff.extra_permissions": "Extra permissions changed",
  "staff.client_link": "Client account link changed",
  "staff.reset_password": "Temporary password issued",
  "staff.password_changed": "Changed their password",
  "staff.pause": "Access paused",
  "staff.resume": "Access resumed",
  "staff.remove": "Removed from staff",
}

export default function StaffMemberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: access } = useAdminAccess()
  const isOwner = !!access?.isOwner

  const { data: member, isLoading, isError } = useQuery({
    queryKey: ["admin-staff", id],
    queryFn: () => getStaffMember(id),
  })
  const { data: roles } = useQuery({ queryKey: ["admin-roles"], queryFn: getRoles })
  const { data: catalog } = useQuery({ queryKey: ["admin-permission-catalog"], queryFn: getPermissionCatalog, staleTime: Infinity })

  const [form, setForm] = useState<Form | null>(null)
  const [loadedAt, setLoadedAt] = useState<string | null>(null)
  if (member && loadedAt !== member.id + member.firstName + member.lastName + member.email + member.staffTitle) {
    setLoadedAt(member.id + member.firstName + member.lastName + member.email + member.staffTitle)
    setForm({
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      email: member.email ?? "",
      staffTitle: member.staffTitle ?? "",
    })
  }

  const [extrasOpen, setExtrasOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [issued, setIssued] = useState<{ name: string; email: string; password: string } | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
    queryClient.invalidateQueries({ queryKey: ["admin-roles"] })
  }
  const fail = (title: string) => (err: unknown) =>
    toast({ title, description: apiError(err, "Failed."), variant: "destructive" })

  const isStaffAccount = member?.accountType === "STAFF"
  const dirty =
    !!member &&
    !!form &&
    (form.firstName !== (member.firstName ?? "") ||
      form.lastName !== (member.lastName ?? "") ||
      form.email !== (member.email ?? "") ||
      form.staffTitle !== (member.staffTitle ?? ""))

  const saveMutation = useMutation({
    mutationFn: () => {
      const f = form!
      return updateStaff(id, {
        staffTitle: f.staffTitle.trim(),
        ...(isStaffAccount ? { firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim() } : {}),
      })
    },
    onSuccess: () => {
      toast({ title: "Details saved" })
      refresh()
    },
    onError: fail("Couldn't save"),
  })
  const roleMutation = useMutation({
    mutationFn: (roleId: string) => setStaffRole(id, roleId),
    onSuccess: () => {
      toast({ title: "Role changed", description: "It applies on their next action." })
      refresh()
    },
    onError: fail("Couldn't change the role"),
  })
  const pauseMutation = useMutation({
    mutationFn: (pause: boolean) => (pause ? pauseStaff(id) : resumeStaff(id)),
    onSuccess: (_, pause) => {
      toast({
        title: pause ? "Access paused" : "Access resumed",
        description: pause ? "They're signed out and can't sign in until you resume them." : "They can sign in again.",
      })
      setRemoveOpen(false)
      refresh()
    },
    onError: fail("Couldn't change access"),
  })
  const resetMutation = useMutation({
    mutationFn: (m: StaffMember & { email?: string | null }) => {
      const email = m.email ? undefined : prompt(`Sign-in email for ${fullName(m)}:`)?.trim()
      if (!m.email && !email) throw new Error("cancelled")
      return resetStaffPassword(m.id, email).then((r) => ({ m, r }))
    },
    onSuccess: ({ m, r }) => {
      setIssued({ name: fullName(m), email: r.email, password: r.temporaryPassword })
      refresh()
    },
    onError: (err) => {
      if ((err as Error).message !== "cancelled") fail("Couldn't reset the password")(err)
    },
  })

  if (isLoading || (member && !form)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !member || !form) {
    return (
      <div className="mx-auto max-w-[1100px] space-y-4 p-6">
        <BackLink />
        <EmptyState title="Staff member not found" description="They may have been removed from staff." />
      </div>
    )
  }

  const role = roles?.find((r) => r.id === member.adminRole?.id) ?? null
  const permissionLabel = (key: string) =>
    catalog?.groups.flatMap((g) => g.permissions).find((p) => p.key === key)?.label ?? key
  const paused = !!member.adminPausedAt

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1100px] space-y-5">
        <BackLink />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{fullName(member)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {member.staffTitle || "Staff"} · added {formatDate(member.createdAt)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {paused ? (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                  Paused since {formatDate(member.adminPausedAt!)}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">Active</Badge>
              )}
              {member.adminMustChangePassword ? <Badge variant="outline">Temporary password</Badge> : null}
              {!isStaffAccount ? <Badge variant="outline">Signs in with a client account</Badge> : null}
            </div>
          </div>
          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={pauseMutation.isPending} onClick={() => pauseMutation.mutate(!paused)}>
                {paused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {paused ? "Resume access" : "Pause access"}
              </Button>
              <Button
                variant="outline"
                disabled={resetMutation.isPending}
                onClick={() =>
                  (!member.email ||
                    confirm(`Issue a new temporary password for ${fullName(member)}? They'll be signed out everywhere.`)) &&
                  resetMutation.mutate(member)
                }
              >
                <KeyRound className="mr-2 h-4 w-4" /> {member.email ? "Reset password" : "Set up login"}
              </Button>
              <Button variant="outline" className="text-destructive" onClick={() => setRemoveOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" id="first" value={form.firstName} maxLength={60}
                  disabled={!isOwner || !isStaffAccount} onChange={(v) => setForm({ ...form, firstName: v })} />
                <Field label="Last name" id="last" value={form.lastName} maxLength={60}
                  disabled={!isOwner || !isStaffAccount} onChange={(v) => setForm({ ...form, lastName: v })} />
              </div>
              <Field label="Job title" id="title" value={form.staffTitle} maxLength={80} placeholder="e.g. Marketing Manager"
                disabled={!isOwner} onChange={(v) => setForm({ ...form, staffTitle: v })} />
              <Field label="Sign-in email" id="email" type="email" value={form.email} maxLength={254}
                disabled={!isOwner || !isStaffAccount} onChange={(v) => setForm({ ...form, email: v })} />
              {!isStaffAccount ? (
                <p className="text-xs text-muted-foreground">
                  This person still signs in with a client account, so their name and email are edited from Individuals.
                </p>
              ) : null}
              {isOwner ? (
                <div className="flex justify-end gap-2">
                  {dirty ? (
                    <Button variant="ghost" onClick={() => setLoadedAt(null)}>Discard</Button>
                  ) : null}
                  <Button
                    disabled={!dirty || saveMutation.isPending || (isStaffAccount && (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()))}
                    onClick={() => saveMutation.mutate()}
                  >
                    {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save details
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Role</Label>
                {isOwner ? (
                  <Select value={member.adminRole?.id ?? ""} onValueChange={(roleId) => roleMutation.mutate(roleId)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No role (no access)" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                            {r.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{member.adminRole?.name ?? "No role"}</p>
                )}
                {role ? <p className="text-xs text-muted-foreground">{role.permissions.length} permissions from this role.</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Extra permissions</Label>
                  {isOwner ? (
                    <Button size="sm" variant="ghost" onClick={() => setExtrasOpen(true)}>
                      <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                  ) : null}
                </div>
                {member.adminExtraPermissions.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {member.adminExtraPermissions.map((p) => (
                      <Badge key={p} variant="outline" className="border-amber-500/40 text-amber-300">{permissionLabel(p)}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None — they have exactly their role&apos;s permissions.</p>
                )}
              </div>

              {isStaffAccount ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Their client account</Label>
                    {isOwner ? (
                      <Button size="sm" variant="ghost" onClick={() => setLinkOpen(true)}>
                        <Link2 className="mr-1.5 h-4 w-4" /> {member.staffClientAccount ? "Change" : "Link"}
                      </Button>
                    ) : null}
                  </div>
                  {member.staffClientAccount ? (
                    <Link className="text-sm underline-offset-2 hover:underline" href={`/admin/users/${member.staffClientAccount.id}`}>
                      {fullName(member.staffClientAccount)}
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not linked.</p>
                  )}
                  <p className="text-xs text-muted-foreground">They can&apos;t take admin actions on a linked client account.</p>
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                Last active: {member.lastActiveAt ? formatDate(member.lastActiveAt) : "never"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {member.activity.length ? (
              <ul className="divide-y divide-white/5 text-sm">
                {member.activity.map((a) => {
                  const byThem = a.actorId === member.id
                  return (
                    <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        <span className="font-medium">{ACTION_LABELS[a.action] ?? a.action}</span>
                        <span className="text-muted-foreground">
                          {byThem
                            ? a.targetId === member.id ? "" : ` · on ${a.targetType}`
                            : ` · by ${a.actor ? fullName(a.actor) : "someone"}`}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No admin activity yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <ExtrasDialog
        member={extrasOpen ? member : null}
        role={role}
        onClose={() => setExtrasOpen(false)}
        onSaved={() => {
          setExtrasOpen(false)
          refresh()
        }}
      />
      <ClientLinkDialog
        member={linkOpen ? member : null}
        onClose={() => setLinkOpen(false)}
        onSaved={() => {
          setLinkOpen(false)
          refresh()
        }}
      />
      <RemoveStaffDialog
        member={removeOpen ? member : null}
        onClose={() => setRemoveOpen(false)}
        onPauseInstead={() => pauseMutation.mutate(true)}
        onRemoved={() => {
          setRemoveOpen(false)
          refresh()
          router.push("/admin/staff")
        }}
      />
      <TemporaryPasswordDialog issued={issued} onClose={() => setIssued(null)} />
    </div>
  )
}

function BackLink() {
  return (
    <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Staff
    </Link>
  )
}

function Field({
  label,
  id,
  value,
  onChange,
  disabled,
  type = "text",
  maxLength,
  placeholder,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  type?: string
  maxLength?: number
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`staff-${id}`}>{label}</Label>
      <Input
        id={`staff-${id}`}
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
