"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Eye, Loader2, Plus, Save, Search, ShieldCheck, Trash2, Undo2 } from "lucide-react"
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-primitives"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { canAccess, type AdminAccess } from "@/lib/admin-access"
import { PAGE_ACCESS } from "@/constant/admin-pages"
import {
  apiError,
  createRole,
  deleteRole,
  getPermissionCatalog,
  getRoles,
  updateRole,
  type AdminRole,
  type RoleInput,
  type RoleTemplate,
} from "@/lib/staff-api"

type Draft = { id: string | null; name: string; description: string; color: string; permissions: string[] }

const NEW_ROLE_COLOR = "#6b7280"
const PAGE_LABELS: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/support": "Support",
  "/admin/users": "Individuals",
  "/admin/signup-attempts": "Signup Drop-offs",
  "/admin/agencies": "Agencies",
  "/admin/companies": "Companies",
  "/admin/enrollments": "Enrollments",
  "/admin/pending-bookings": "Bookings",
  "/admin/services": "Services",
  "/admin/conversations": "Conversations",
  "/admin/verifications": "Verifications",
  "/admin/company-services": "Company Services",
  "/admin/reports": "Reports",
  "/admin/reviews": "Reviews",
  "/admin/service-categories": "Service taxonomy",
  "/admin/banners": "Hero Banners",
  "/admin/announcements": "Announcements",
  "/admin/languages": "Languages",
  "/admin/legal": "Legal Documents",
  "/admin/audit-logs": "Audit Logs",
  "/admin/staff": "Staff (read-only)",
}

const toDraft = (role: AdminRole): Draft => ({
  id: role.id,
  name: role.name,
  description: role.description ?? "",
  color: role.color,
  permissions: [...role.permissions].sort(),
})

const sameDraft = (a: Draft | null, b: Draft | null) => JSON.stringify(a) === JSON.stringify(b)

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient()
  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["admin-permission-catalog"],
    queryFn: getPermissionCatalog,
    staleTime: Infinity,
  })
  const { data: roles, isLoading: rolesLoading } = useQuery({ queryKey: ["admin-roles"], queryFn: getRoles })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [search, setSearch] = useState("")

  const selected = roles?.find((r) => r.id === selectedId) ?? null
  const baseline = selected ? toDraft(selected) : null
  const dirty = draft ? draft.id === null || !sameDraft(draft, baseline) : false

  // Select the first role once roles load, and follow the selection.
  useEffect(() => {
    if (!roles) return
    if (draft?.id === null) return
    if (!selectedId && roles.length) setSelectedId(roles[0].id)
  }, [roles, selectedId, draft?.id])
  // Load the saved version when the selection (or its saved copy) changes —
  // keyed on updatedAt so a background refetch never wipes unsaved edits.
  useEffect(() => {
    if (selected) setDraft(toDraft(selected))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.updatedAt])

  const allKeys = useMemo(() => catalog?.groups.flatMap((g) => g.permissions.map((p) => p.key)) ?? [], [catalog])
  const highRisk = useMemo(
    () => new Set(catalog?.groups.flatMap((g) => g.permissions.filter((p) => p.risk === "high").map((p) => p.key)) ?? []),
    [catalog],
  )

  const confirmDiscard = () => !dirty || confirm("Discard your unsaved changes to this role?")

  const pick = (role: AdminRole) => {
    if (role.id === selectedId || !confirmDiscard()) return
    setSelectedId(role.id)
  }

  const startNew = (template?: RoleTemplate) => {
    if (!confirmDiscard()) return
    setSelectedId(null)
    setDraft({
      id: null,
      name: template ? template.name : "",
      description: template?.description ?? "",
      color: template?.color ?? NEW_ROLE_COLOR,
      permissions: template ? [...template.permissions].sort() : [],
    })
  }

  const onSaved = async (role: AdminRole) => {
    await queryClient.invalidateQueries({ queryKey: ["admin-roles"] })
    setSelectedId(role.id)
    setDraft(toDraft(role))
  }

  const saveMutation = useMutation({
    mutationFn: (d: Draft) => {
      const input: RoleInput = { name: d.name.trim(), description: d.description.trim(), color: d.color, permissions: d.permissions }
      return d.id ? updateRole(d.id, input) : createRole(input)
    },
    onSuccess: async (role) => {
      toast({ title: "Role saved", description: "Members get the change on their next action." })
      await onSaved(role)
    },
    onError: (err) => toast({ title: "Couldn't save the role", description: apiError(err, "Save failed."), variant: "destructive" }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: async () => {
      toast({ title: "Role deleted" })
      setSelectedId(null)
      setDraft(null)
      await queryClient.invalidateQueries({ queryKey: ["admin-roles"] })
    },
    onError: (err) => toast({ title: "Couldn't delete the role", description: apiError(err, "Delete failed."), variant: "destructive" }),
  })

  const toggle = (key: string, on: boolean) =>
    setDraft((d) => d && { ...d, permissions: on ? [...new Set([...d.permissions, key])].sort() : d.permissions.filter((p) => p !== key) })

  const toggleGroup = (keys: string[], on: boolean) =>
    setDraft((d) =>
      d && {
        ...d,
        permissions: on
          ? [...new Set([...d.permissions, ...keys])].sort()
          : d.permissions.filter((p) => !keys.includes(p)),
      },
    )

  // "View as": which pages a member of this role would see in the sidebar.
  const preview: AdminAccess | undefined = draft
    ? { isOwner: false, isStaff: true, roleId: draft.id, roleName: draft.name, displayName: null, email: null, permissions: draft.permissions, extraPermissions: [], mustChangePassword: false }
    : undefined
  const visiblePages = Object.entries(PAGE_LABELS).filter(([url]) => canAccess(preview, PAGE_ACCESS[url]))

  const query = search.trim().toLowerCase()
  const groups = (catalog?.groups ?? [])
    .map((g) => ({
      ...g,
      permissions: g.permissions.filter(
        (p) => !query || `${p.label} ${p.description} ${p.key}`.toLowerCase().includes(query),
      ),
    }))
    .filter((g) => g.permissions.length)

  const draftHighRisk = draft?.permissions.filter((p) => highRisk.has(p)).length ?? 0

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Roles & Permissions"
          description="Each staff member holds one role. Turn on exactly what that role can do; the owner always has everything."
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem onClick={() => startNew()}>Blank role</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Start from a template</DropdownMenuLabel>
              {catalog?.templates.map((t) => (
                <DropdownMenuItem key={t.name} onClick={() => startNew(t)} className="flex-col items-start gap-0.5">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </AdminPageHeader>

        {rolesLoading || catalogLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Role list */}
            <div className="space-y-1.5">
              {roles?.length === 0 && draft?.id !== null ? (
                <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-muted-foreground">
                  No roles yet. Create one from a template to get started.
                </p>
              ) : null}
              {draft?.id === null ? (
                <div className="flex items-center gap-3 rounded-md bg-[#145B10] px-3 py-2.5 text-sm font-medium">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: draft.color }} />
                  <span className="truncate">{draft.name || "New role"}</span>
                  <Badge variant="outline" className="ml-auto">unsaved</Badge>
                </div>
              ) : null}
              {roles?.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => pick(role)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5",
                    role.id === selectedId ? "bg-[#145B10] font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: role.color }} />
                  <span className="min-w-0 flex-1 truncate">{role.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
                  </span>
                </button>
              ))}
            </div>

            {/* Editor */}
            {!draft ? (
              <EmptyState title="Pick a role to edit" description="Or create a new one." icon={ShieldCheck} />
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Role name</Label>
                      <Input
                        id="role-name"
                        value={draft.name}
                        maxLength={60}
                        placeholder="e.g. Marketing"
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-color">Colour</Label>
                      <Input
                        id="role-color"
                        type="color"
                        className="h-10 w-20 cursor-pointer p-1"
                        value={draft.color}
                        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="role-description">Description</Label>
                      <Textarea
                        id="role-description"
                        rows={2}
                        maxLength={300}
                        value={draft.description}
                        placeholder="What is this role for?"
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4" /> Pages this role can open
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {visiblePages.length ? (
                        visiblePages.map(([url, label]) => (
                          <Badge key={url} variant="outline">{label}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          None yet. Turn on a permission below to give this role a page.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {draft.permissions.length} of {allKeys.length} permissions on
                      {draftHighRisk ? ` · ${draftHighRisk} high-risk` : ""}
                      {!draft.permissions.includes("users.view_contact") ? " · phone numbers and emails are masked" : ""}
                    </p>
                  </CardContent>
                </Card>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions…"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {groups.map((group) => {
                  const keys = group.permissions.map((p) => p.key)
                  const allOn = keys.every((k) => draft.permissions.includes(k))
                  return (
                    <Card key={group.key}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base">{group.label}</CardTitle>
                        <Button type="button" variant="ghost" size="sm" onClick={() => toggleGroup(keys, !allOn)}>
                          {allOn ? "Turn all off" : "Turn all on"}
                        </Button>
                      </CardHeader>
                      <CardContent className="divide-y divide-white/5 p-0">
                        {group.permissions.map((p) => {
                          const on = draft.permissions.includes(p.key)
                          return (
                            <label
                              key={p.key}
                              htmlFor={`perm-${p.key}`}
                              className="flex cursor-pointer items-start gap-4 px-6 py-3 hover:bg-white/[0.02]"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                  {p.label}
                                  {p.risk === "high" ? (
                                    <Badge variant="outline" className="gap-1 border-red-500/40 text-red-400">
                                      <AlertTriangle className="h-3 w-3" /> High risk
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">{p.description}</p>
                              </div>
                              <Switch id={`perm-${p.key}`} checked={on} onCheckedChange={(v) => toggle(p.key, v)} />
                            </label>
                          )
                        })}
                      </CardContent>
                    </Card>
                  )
                })}

                {draft.id ? (
                  <Card className="border-red-500/20">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div>
                        <p className="text-sm font-medium">Delete role</p>
                        <p className="text-xs text-muted-foreground">
                          {selected?.memberCount
                            ? "Move its members to another role on the Staff page first."
                            : "Nobody holds this role."}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        disabled={!!selected?.memberCount || deleteMutation.isPending}
                        onClick={() => confirm(`Delete the role "${draft.name}"?`) && deleteMutation.mutate(draft.id!)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                {dirty ? (
                  <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0f1110]/95 px-4 py-3 shadow-lg backdrop-blur">
                    <p className="text-sm">{draft.id ? "You have unsaved changes." : "This role isn't saved yet."}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (selected) setDraft(toDraft(selected))
                          else {
                            setDraft(null)
                            if (roles?.length) setSelectedId(roles[0].id)
                          }
                        }}
                      >
                        <Undo2 className="mr-2 h-4 w-4" /> {draft.id ? "Reset" : "Cancel"}
                      </Button>
                      <Button
                        disabled={!draft.name.trim() || saveMutation.isPending}
                        onClick={() => saveMutation.mutate(draft)}
                      >
                        {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save role
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
