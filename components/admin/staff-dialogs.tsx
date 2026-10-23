"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, Copy, Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { getAllUsers, type User } from "@/lib/api"
import {
  apiError,
  createStaff,
  getPermissionCatalog,
  removeStaff,
  setStaffClientLink,
  setStaffExtras,
  type AdminRole,
  type StaffMember,
} from "@/lib/staff-api"

// Dialogs shared by the Staff list and the staff detail page.

export const fullName = (p: { firstName: string | null; lastName: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed"

/** A temporary password is shown exactly once, right after it is issued. */
export function TemporaryPasswordDialog({
  issued,
  onClose,
}: {
  issued: { name: string; email: string; password: string } | null
  onClose: () => void
}) {
  const copy = useCopyToClipboard()
  return (
    <Dialog open={!!issued} onOpenChange={(o) => !o && onClose()}>
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
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Permanent removal needs the person's full name typed back, so a stray click
 * can't do it. Points to Pause as the reversible option.
 */
export function RemoveStaffDialog({
  member,
  onClose,
  onRemoved,
  onPauseInstead,
}: {
  member: StaffMember | null
  onClose: () => void
  onRemoved: () => void
  onPauseInstead?: () => void
}) {
  const [typed, setTyped] = useState("")
  const name = member ? fullName(member) : ""
  const matches = typed.trim().toLowerCase() === name.toLowerCase()

  const mutation = useMutation({
    mutationFn: () => removeStaff(member!.id, typed.trim()),
    onSuccess: () => {
      toast({ title: "Staff access removed", description: "Their client account, if any, is unchanged." })
      setTyped("")
      onRemoved()
    },
    onError: (err) => toast({ title: "Couldn't remove", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  return (
    <Dialog
      open={!!member}
      onOpenChange={(o) => {
        if (!o) {
          setTyped("")
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {name} from staff?</DialogTitle>
          <DialogDescription>
            This can&apos;t be undone: their role, extras and panel sign-in are removed. To stop access temporarily, pause them instead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="remove-confirm">
            Type <span className="font-semibold text-foreground">{name}</span> to confirm
          </Label>
          <Input id="remove-confirm" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {onPauseInstead && !member?.adminPausedAt ? (
            <Button variant="outline" onClick={onPauseInstead}>Pause instead</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" disabled={!matches || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove permanently
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddStaffDialog({
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
  const [title, setTitle] = useState("")
  const [email, setEmail] = useState("")
  const [roleId, setRoleId] = useState("")
  const [client, setClient] = useState<User | null>(null)

  const reset = () => {
    setFirstName("")
    setLastName("")
    setTitle("")
    setEmail("")
    setRoleId("")
    setClient(null)
  }

  const mutation = useMutation({
    mutationFn: () =>
      createStaff({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        staffTitle: title.trim() || undefined,
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
            <Label htmlFor="staff-title">Job title (optional)</Label>
            <Input id="staff-title" placeholder="e.g. Marketing Manager" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
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
export function ClientAccountPicker({
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
export function ClientLinkDialog({
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
export function ExtrasDialog({
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
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="text-destructive"
            disabled={!extras.some((p) => !fromRole.has(p)) || mutation.isPending}
            onClick={() => setExtras([])}
          >
            Remove all extras
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save extras
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
