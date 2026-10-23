"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRight, Link2, Loader2, Plus, UserCog } from "lucide-react"
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-primitives"
import { AddStaffDialog, TemporaryPasswordDialog, fullName } from "@/components/admin/staff-dialogs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { useAdminAccess } from "@/lib/admin-access"
import { apiError, getRoles, getStaff, setStaffRole } from "@/lib/staff-api"

export default function StaffPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: access } = useAdminAccess()
  // Only the owner changes anything here; "View staff" holders get a read-only list.
  const isOwner = !!access?.isOwner
  const { data: staff, isLoading } = useQuery({ queryKey: ["admin-staff"], queryFn: getStaff })
  const { data: roles } = useQuery({ queryKey: ["admin-roles"], queryFn: getRoles })

  const [addOpen, setAddOpen] = useState(false)
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

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Staff"
          description={
            isOwner
              ? "Your team's admin-panel accounts. Open someone to edit, pause or remove them."
              : "Your team's admin-panel accounts. Read-only: only the owner can change staff."
          }
        >
          {isOwner ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/admin/roles-permissions">Manage roles</Link>
              </Button>
              <Button onClick={() => setAddOpen(true)} disabled={!roles?.length}>
                <Plus className="mr-2 h-4 w-4" /> Add staff
              </Button>
            </>
          ) : null}
        </AdminPageHeader>

        {isOwner && !roles?.length && !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Create a role first on <Link className="underline" href="/admin/roles-permissions">Roles &amp; Permissions</Link>.
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !staff?.length ? (
          <EmptyState title="No staff yet" description="Add a staff account and give it a role." icon={UserCog} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Sign-in email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((m) => (
                      <TableRow
                        key={m.id}
                        className="cursor-pointer hover:bg-white/[0.03]"
                        onClick={() => router.push(`/admin/staff/${m.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium">{fullName(m)}</div>
                          {m.staffTitle ? <div className="text-xs text-muted-foreground">{m.staffTitle}</div> : null}
                          {m.staffClientAccount ? (
                            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Link2 className="h-3 w-3" /> Client: {fullName(m.staffClientAccount)}
                            </div>
                          ) : null}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.adminPausedAt ? (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-300">Paused</Badge>
                            ) : null}
                            {m.adminMustChangePassword ? <Badge variant="outline">Temporary password</Badge> : null}
                            {m.isBanned ? <Badge variant="destructive">Banned — no access</Badge> : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{m.email || "—"}</TableCell>
                        <TableCell className="min-w-[200px]" onClick={(e) => isOwner && e.stopPropagation()}>
                          {isOwner ? (
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
                          ) : (
                            <span className="flex items-center gap-2 text-sm">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.adminRole?.color ?? "#6b7280" }} />
                              {m.adminRole?.name ?? "No role"}
                            </span>
                          )}
                          {m.adminExtraPermissions.length ? (
                            <Badge variant="outline" className="mt-1.5 border-amber-500/40 text-amber-300">
                              +{m.adminExtraPermissions.length} extra
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.lastActiveAt ? formatDate(m.lastActiveAt) : "Never"}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
      <TemporaryPasswordDialog issued={issued} onClose={() => setIssued(null)} />
    </div>
  )
}
