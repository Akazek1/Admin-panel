"use client"

import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Crown, KeyRound, Loader2, Mail, Trash2 } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { ADMIN_ACCESS_QUERY_KEY, useAdminAccess } from "@/lib/admin-access"
import { apiError, changeOwnEmail, getOwners, removeOwner, type OwnerAccount } from "@/lib/staff-api"

const ownerName = (o: OwnerAccount) => [o.firstName, o.lastName].filter(Boolean).join(" ") || "Unnamed"

export default function SettingsPage() {
  const { data: access } = useAdminAccess()
  const isOwner = !!access?.isOwner

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[900px] space-y-5">
        <AdminPageHeader title="Settings" description="Your admin-panel account." />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{access?.displayName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Access</p>
                <p className="flex items-center gap-1.5 font-medium">
                  {isOwner ? <Crown className="h-4 w-4 text-amber-400" /> : null}
                  {isOwner ? "Owner" : access?.roleName ?? "Staff"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sign-in email</p>
                <p className="font-medium">{access?.email ?? "—"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/change-password">
                  <KeyRound className="mr-2 h-4 w-4" /> Change password
                </Link>
              </Button>
            </div>
            {!isOwner ? (
              <p className="text-xs text-muted-foreground">To change your sign-in email or name, ask the owner.</p>
            ) : null}
          </CardContent>
        </Card>

        {isOwner ? <ChangeEmailCard currentEmail={access?.email ?? ""} /> : null}
        {isOwner ? <OwnersCard /> : null}
      </div>
    </div>
  )
}

function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const queryClient = useQueryClient()
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")

  const mutation = useMutation({
    mutationFn: () => changeOwnEmail(password, newEmail.trim()),
    onSuccess: (r) => {
      toast({ title: "Sign-in email changed", description: `Next time, sign in with ${r.email}.` })
      setNewEmail("")
      setPassword("")
      queryClient.invalidateQueries({ queryKey: ADMIN_ACCESS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] })
    },
    onError: (err) => toast({ title: "Couldn't change the email", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" /> Change sign-in email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-email">New email</Label>
            <Input id="new-email" type="email" placeholder="you@huza.app" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-password">Your current password</Label>
            <Input id="email-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Your password stays the same. You stay signed in.</p>
          <Button
            disabled={!newEmail.trim() || !password || newEmail.trim().toLowerCase() === currentEmail || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Change email
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OwnersCard() {
  const queryClient = useQueryClient()
  const { data: owners, isLoading } = useQuery({ queryKey: ["admin-owners"], queryFn: getOwners })
  const [target, setTarget] = useState<OwnerAccount | null>(null)
  const [typed, setTyped] = useState("")
  const [password, setPassword] = useState("")

  const close = () => {
    setTarget(null)
    setTyped("")
    setPassword("")
  }

  const mutation = useMutation({
    mutationFn: () => removeOwner(target!.id, password, typed.trim()),
    onSuccess: () => {
      toast({ title: "Owner access removed", description: "That account is signed out and can no longer sign in to the panel." })
      close()
      queryClient.invalidateQueries({ queryKey: ["admin-owners"] })
    },
    onError: (err) => toast({ title: "Couldn't remove", description: apiError(err, "Failed."), variant: "destructive" }),
  })

  const onlyOwner = (owners?.length ?? 0) <= 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-amber-400" /> Owner accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Owners have full access to everything. Keep this to yourself only. You can&apos;t remove yourself, and there&apos;s always at least one owner.
        </p>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <ul className="divide-y divide-white/5 rounded-md border border-white/10">
            {owners?.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {ownerName(o)}
                    {o.isYou ? <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">You</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {o.email ?? "no email"} · last sign-in {o.lastLoginAt ? formatDate(o.lastLoginAt) : "never"}
                  </p>
                </div>
                {!o.isYou ? (
                  <Button variant="outline" size="sm" className="text-destructive" disabled={onlyOwner} onClick={() => setTarget(o)}>
                    <Trash2 className="mr-1.5 h-4 w-4" /> Remove owner
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!target} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove owner access from {target ? ownerName(target) : ""}?</DialogTitle>
            <DialogDescription>
              They&apos;re signed out at once and lose their panel password. Their client account, if any, stays.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="owner-confirm">
                Type <span className="font-semibold text-foreground">{target?.email}</span> to confirm
              </Label>
              <Input id="owner-confirm" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-password">Your password</Label>
              <Input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={typed.trim().toLowerCase() !== (target?.email ?? "").toLowerCase() || !password || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove owner access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
