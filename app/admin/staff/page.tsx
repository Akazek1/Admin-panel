"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Copy, KeyRound, Link2, Loader2, Plus, Search, SlidersHorizontal, Trash2, UserCog } from "lucide-react"
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { formatDate } from "@/lib/utils"
import { getAllUsers, type User } from "@/lib/api"
import {
  apiError,
  createStaff,
  getPermissionCatalog,
  getRoles,
  getStaff,
  removeStaff,
  resetStaffPassword,
  setStaffClientLink,
  setStaffExtras,
  setStaffRole,
  type AdminRole,
  type StaffMember,
} from "@/lib/staff-api"

const fullName = (p: { firstName: string | null; lastName: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed"

export default function StaffPage() {
  const queryClient = useQueryClient()
  const copy = useCopyToClipboard()
  const { data: staff, isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: getStaff })
  const { data: roles } = useQuery({ queryKey: ["admin-roles"], queryFn: getRoles })

  const [addOpen, setAddOpen] = useState(false)
  const [extrasFor, setExtrasFor] = useState<StaffMember | null>(null)
  const [linkFor, setLinkFor] = useState<StaffMember | null>(null)
  // A temporary password is shown exactly once, right after it is issued.
  const [issued, setIssued] = useState<{ name: string; email: string; password: string } | null>(null)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
    queryClient.invalidateQueries({ queryKey: ["admin-roles"] })
  }

  const roleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) => setStaffRole(id, roleId),
    onSuccess: () => {
      toast({ title: "Role changed", description: "It applies on their next action." })
      refresh()
    },
    onError: (err) => toast({ title: "Couldn't change the role", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  const resetMutation = useMutation({
    mutationFn: ({ m, email }: { m: StaffMember; email?: string }) => resetStaffPassword(m.id, email).then((r) => ({ m, r })),
    onSuccess: ({ m, r }) => {
      setIssued({ name: fullName(m), email: r.email, password: r.temporaryPassword })
      refresh()
    },
    onError: (err) => toast({ title: "Couldn't reset the password", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeStaff(id),
    onSuccess: () => {
      toast({ title: "Staff access removed", description: "Their normal Huza account is unchanged." })
      refresh()
    },
    onError: (err) => toast({ title: "Couldn't remove access", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Staff"
          description="Your team's admin-panel accounts. Separate from client accounts; each holds one role."
        >
          <Button variant="outline" asChild>
            <Link href="/admin/roles-permissions">Manage roles</Link>
          </Button>
          <Button onClick={() => setAddOpen(true)} disabled={!roles?.length}>
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </Button>
        </AdminPageHeader>

        {!roles?.length && !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Create a role first on <Link className="underline" href="/admin/roles-permissions">Roles &amp; Permissions</Link>.
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !staff?.length ? (
          <EmptyState
            title="No staff yet"
            description="Add someone who already has a Huza account and give them a role."
            icon={UserCog}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Login email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="font-medium">{fullName(m)}</div>
                          {m.accountType === "STAFF" ? (
                            <button
                              type="button"
                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setLinkFor(m)}
                            >
                              <Link2 className="h-3 w-3" />
                              {m.staffClientAccount ? `Client: ${fullName(m.staffClientAccount)}` : "Link client account"}
                            </button>
                          ) : (
                            <div className="text-xs text-muted-foreground">{m.phoneNumber}</div>
                          )}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.accountType !== "STAFF" ? (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-300" title="Promoted from a client account before staff accounts existed. Create a staff account for them and remove this one.">
                                Uses a client account
                              </Badge>
                            ) : null}
                            {m.adminMustChangePassword ? <Badge variant="outline">Temporary password</Badge> : null}
                            {m.isBanned ? <Badge variant="destructive">Banned — no access</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{m.email || "—"}</TableCell>
                        <TableCell className="min-w-[200px]">
                          <Select
                            value={m.adminRole?.id ?? ""}
                            onValueChange={(roleId) => roleMutation.mutate({ id: m.id, roleId })}
                          >
                            <SelectTrigger className="h-9">
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
                          {m.adminExtraPermissions.length ? (
                            <Badge variant="outline" className="mt-1.5 border-amber-500/40 text-amber-300">
                              +{m.adminExtraPermissions.length} extra
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.lastActiveAt ? formatDate(m.lastActiveAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setExtrasFor(m)}>
                              <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Extras
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={resetMutation.isPending}
                              onClick={() => {
                                if (!m.email) {
                                  // Migrated sub-admins have no panel login yet.
                                  const email = prompt(`Sign-in email for ${fullName(m)}:`)?.trim()
                                  if (email) resetMutation.mutate({ m, email })
                                  return
                                }
                                if (confirm(`Issue a new temporary password for ${fullName(m)}? They'll be signed out everywhere.`)) {
                                  resetMutation.mutate({ m })
                                }
                              }}
                            >
                              <KeyRound className="mr-1.5 h-4 w-4" /> {m.email ? "Reset password" : "Set up login"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={removeMutation.isPending}
                              onClick={() =>
                                confirm(`Remove ${fullName(m)}'s admin access? Their normal account stays.`) &&
                                removeMutation.mutate(m.id)
                              }
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ClientLinkDialog
        member={linkFor}
        onClose={() => setLinkFor(null)}
        onSaved={() => {
          setLinkFor(null)
          refresh()
        }}
      />

      <ExtrasDialog
        member={extrasFor}
        role={roles?.find((r) => r.id === extrasFor?.adminRole?.id) ?? null}
        onClose={() => setExtrasFor(null)}
        onSaved={() => {
          setExtrasFor(null)
          refresh()
        }}
      />

      <AddStaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        roles={roles ?? []}
        onAdded={(name, email, password) => {
          setAddOpen(false)
          setIssued({ name, email, password })
          refresh()
        }}
      />

      <Dialog open={!!issued} onOpenChange={(o) => !o && setIssued(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password for {issued?.name}</DialogTitle>
            <DialogDescription>
              Shown only once. Share it privately (not in a group chat). They must choose their own password when they first sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Sign-in email</Label>
              <p className="font-medium">{issued?.email}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Temporary password</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-base tracking-wider">{issued?.password}</code>
                <Button variant="outline" size="icon" onClick={() => issued && copy(issued.password, "Password")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIssued(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddStaffDialog({
  open,
  onOpenChange,
  roles,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: { id: string; name: string; color: string }[]
  onAdded: (name: string, email: string, password: string) => void
}) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [client, setClient] = useState<User | null>(null)

  const reset = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setRoleId("")
    setClient(null)
  }

  const mutation = useMutation({
    mutationFn: () =>
      createStaff({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        roleId,
        clientAccountId: client?.id,
      }),
    onSuccess: (r) => {
      onAdded(`${firstName.trim()} ${lastName.trim()}`, r.email, r.temporaryPassword)
      reset()
    },
    onError: (err) => toast({ title: "Couldn't add staff", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>
            Creates a new admin-panel account. It isn&apos;t a client account and can&apos;t sign in to the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="staff-first">First name</Label>
              <Input id="staff-first" value={firstName} maxLength={60} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last">Last name</Label>
              <Input id="staff-last" value={lastName} maxLength={60} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-email">Sign-in email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="name@huza.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use a work email. An email can belong to only one account, so not the one on their client account.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Their client account (optional)</Label>
            <ClientAccountPicker value={client} onChange={setClient} enabled={open} />
            <p className="text-xs text-muted-foreground">
              If this person also uses Huza as a client, link it so they can&apos;t moderate their own account.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!firstName.trim() || !lastName.trim() || !email.trim() || !roleId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create and issue password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Search the client accounts (staff and admins excluded) and pick one. */
function ClientAccountPicker({
  value,
  onChange,
  enabled,
}: {
  value: { id: string; firstName: string | null; lastName: string | null; phoneNumber?: string } | null
  onChange: (user: User | null) => void
  enabled: boolean
}) {
  const [search, setSearch] = useState("")
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users-for-staff"], queryFn: getAllUsers, enabled })

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return (users ?? [])
      .filter((u) => !u.isAdmin && !u.roles.includes("ADMIN") && !u.roles.includes("SUB_ADMIN"))
      .filter((u) => `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.phoneNumber} ${u.email ?? ""}`.toLowerCase().includes(q))
      .slice(0, 6)
  }, [users, search])

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="font-medium">{fullName(value)}</p>
          {value.phoneNumber ? <p className="text-xs text-muted-foreground">{value.phoneNumber}</p> : null}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search clients by name, phone or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {isLoading && search.trim() ? <p className="text-xs text-muted-foreground">Loading accounts…</p> : null}
      {matches.length ? (
        <div className="max-h-48 divide-y overflow-auto rounded-md border">
          {matches.map((u) => (
            <button
              key={u.id}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
              onClick={() => {
                onChange(u)
                setSearch("")
              }}
            >
              <span className="text-sm font-medium">{fullName(u)}</span>
              <span className="text-xs text-muted-foreground">{u.phoneNumber}</span>
            </button>
          ))}
        </div>
      ) : search.trim() && !isLoading ? (
        <p className="text-xs text-muted-foreground">No matching client account.</p>
      ) : null}
    </div>
  )
}

/** Link or unlink a staff member's own client account. */
function ClientLinkDialog({
  member,
  onClose,
  onSaved,
}: {
  member: StaffMember | null
  onClose: () => void
  onSaved: () => void
}) {
  const [client, setClient] = useState<StaffMember["staffClientAccount"] | User | null>(null)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (member && loadedFor !== member.id) {
    setLoadedFor(member.id)
    setClient(member.staffClientAccount)
  }

  const mutation = useMutation({
    mutationFn: () => setStaffClientLink(member!.id, client?.id ?? null),
    onSuccess: () => {
      toast({ title: client ? "Client account linked" : "Client account unlinked" })
      onSaved()
    },
    onError: (err) => toast({ title: "Couldn't save", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  return (
    <Dialog
      open={!!member}
      onOpenChange={(o) => {
        if (!o) {
          setLoadedFor(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Client account for {member ? fullName(member) : ""}</DialogTitle>
          <DialogDescription>
            Link the client account this person uses on Huza. They won&apos;t be able to take admin actions on it.
          </DialogDescription>
        </DialogHeader>
        <ClientAccountPicker value={client} onChange={setClient} enabled={!!member} />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Owner-granted permissions on top of one person's role. Grants only. */
function ExtrasDialog({
  member,
  role,
  onClose,
  onSaved,
}: {
  member: StaffMember | null
  role: AdminRole | null
  onClose: () => void
  onSaved: () => void
}) {
  const { data: catalog } = useQuery({ queryKey: ["admin-permission-catalog"], queryFn: getPermissionCatalog, staleTime: Infinity })
  const [extras, setExtras] = useState<string[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  if (member && loadedFor !== member.id) {
    setLoadedFor(member.id)
    setExtras(member.adminExtraPermissions)
  }
  const fromRole = new Set(role?.permissions ?? [])

  const mutation = useMutation({
    mutationFn: () => setStaffExtras(member!.id, extras.filter((p) => !fromRole.has(p))),
    onSuccess: () => {
      toast({ title: "Extra permissions saved", description: "They apply on the person's next action." })
      onSaved()
    },
    onError: (err) => toast({ title: "Couldn't save", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  const toggle = (key: string, on: boolean) =>
    setExtras((cur) => (on ? [...new Set([...cur, key])] : cur.filter((p) => p !== key)))

  return (
    <Dialog
      open={!!member}
      onOpenChange={(o) => {
        if (!o) {
          setLoadedFor(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extra permissions for {member ? fullName(member) : ""}</DialogTitle>
          <DialogDescription>
            Added on top of their role{role ? ` (${role.name})` : ""}, for this person only. Extras can only add access, never remove it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {catalog?.groups.map((group) => (
            <div key={group.key}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
              <div className="divide-y divide-white/5 rounded-md border border-white/10">
                {group.permissions.map((p) => {
                  const inRole = fromRole.has(p.key)
                  return (
                    <label key={p.key} htmlFor={`extra-${p.key}`} className="flex cursor-pointer items-start gap-4 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {p.label}
                          {p.risk === "high" ? (
                            <Badge variant="outline" className="gap-1 border-red-500/40 text-red-400">
                              <AlertTriangle className="h-3 w-3" /> High risk
                            </Badge>
                          ) : null}
                          {inRole ? <Badge variant="outline">In role</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <Switch
                        id={`extra-${p.key}`}
                        checked={inRole || extras.includes(p.key)}
                        disabled={inRole}
                        onCheckedChange={(v) => toggle(p.key, v)}
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save extras
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
