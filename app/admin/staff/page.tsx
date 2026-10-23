"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, KeyRound, Loader2, Plus, Search, Trash2, UserCog } from "lucide-react"
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { formatDate } from "@/lib/utils"
import { getAllUsers, type User } from "@/lib/api"
import {
  addStaff,
  apiError,
  getRoles,
  getStaff,
  removeStaff,
  resetStaffPassword,
  setStaffRole,
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
          description="People who can sign in to this admin panel. Each one holds a single role."
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
                          <div className="text-xs text-muted-foreground">{m.phoneNumber}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
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
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.lastActiveAt ? formatDate(m.lastActiveAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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
  const [search, setSearch] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [roleId, setRoleId] = useState("")
  const [email, setEmail] = useState("")

  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users-for-staff"], queryFn: getAllUsers, enabled: open })

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return (users ?? [])
      .filter((u) => !u.isAdmin && !u.roles.includes("ADMIN") && !u.roles.includes("SUB_ADMIN") && !u.isBanned)
      .filter((u) => `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.phoneNumber} ${u.email ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [users, search])

  const reset = () => {
    setSearch("")
    setUser(null)
    setRoleId("")
    setEmail("")
  }

  const mutation = useMutation({
    mutationFn: () => addStaff({ userId: user!.id, roleId, email: email.trim() || undefined }),
    onSuccess: (r) => {
      onAdded(fullName(user!), r.email, r.temporaryPassword)
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
          <DialogDescription>Pick an existing Huza account, give it a role and a sign-in email.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {user ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{fullName(user)}</p>
                <p className="text-xs text-muted-foreground">{user.phoneNumber}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setUser(null)}>Change</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="staff-search">Account</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="staff-search"
                  className="pl-8"
                  placeholder="Search by name, phone or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isLoading ? <p className="text-xs text-muted-foreground">Loading accounts…</p> : null}
              {matches.length ? (
                <div className="max-h-56 divide-y overflow-auto rounded-md border">
                  {matches.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
                      onClick={() => {
                        setUser(u)
                        setEmail(u.email ?? "")
                      }}
                    >
                      <span className="text-sm font-medium">{fullName(u)}</span>
                      <span className="text-xs text-muted-foreground">{u.phoneNumber}{u.email ? ` · ${u.email}` : ""}</span>
                    </button>
                  ))}
                </div>
              ) : search.trim() && !isLoading ? (
                <p className="text-xs text-muted-foreground">No matching account. They need a Huza account first.</p>
              ) : null}
            </div>
          )}

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
            <Label htmlFor="staff-email">Sign-in email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="name@huza.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">They sign in to the panel with this email and a temporary password.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!user || !roleId || !email.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add and issue password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
