"use client"

import React, { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Edit, Trash2, Link2, Tags, X, Search } from "lucide-react"

type Lang = "EN" | "RW" | "FR"
type TagKind = "PRIMARY" | "ALIAS" | "SYNONYM" | "MISSPELLING"

interface JobTypeRef { id: string; name: string; nameKn: string | null }
interface Assignment { id: string; categoryId: string; sortOrder: number; category: JobTypeRef }
interface GroupTag { id: string; tag: string; language: Lang; tagType: TagKind }

interface ServiceCategory {
  id: string
  name: string
  nameKn: string | null
  nameFr: string | null
  icon: string | null
  description: string | null
  isActive: boolean
  sortOrder: number
  assignments: Assignment[]
  tags: GroupTag[]
  _count?: { assignments: number; tags: number }
}

interface Category { id: string; name: string; nameKn: string | null }

const unwrap = <T,>(payload: any): T[] => {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  return []
}

const LANGS: { value: Lang; label: string }[] = [
  { value: "EN", label: "English" },
  { value: "RW", label: "Kinyarwanda" },
  { value: "FR", label: "French" },
]
const TAG_KINDS: { value: TagKind; label: string }[] = [
  { value: "PRIMARY", label: "Primary" },
  { value: "ALIAS", label: "Alias" },
  { value: "SYNONYM", label: "Synonym" },
  { value: "MISSPELLING", label: "Misspelling" },
]

export default function ServiceCategoriesPage() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-service-categories"] })

  const [selected, setSelected] = useState<ServiceCategory | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [jobTypesFor, setJobTypesFor] = useState<ServiceCategory | null>(null)
  const [tagsFor, setTagsFor] = useState<ServiceCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [newTag, setNewTag] = useState<{ tag: string; language: Lang; tagType: TagKind }>({
    tag: "", language: "EN", tagType: "ALIAS",
  })

  const [formData, setFormData] = useState({
    name: "", nameKn: "", nameFr: "", icon: "", description: "", isActive: true, sortOrder: 0,
  })

  const { data: groups, isLoading } = useQuery<ServiceCategory[]>({
    queryKey: ["admin-service-categories"],
    queryFn: async () => unwrap<ServiceCategory>((await axiosInstance.get("/admin/service-categories")).data),
  })

  const { data: jobTypes } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => unwrap<Category>((await axiosInstance.get("/admin/categories")).data),
  })

  // Keep the open dialogs in sync with refetched data
  const liveJobTypesFor = useMemo(
    () => groups?.find((g) => g.id === jobTypesFor?.id) ?? jobTypesFor,
    [groups, jobTypesFor],
  )
  const liveTagsFor = useMemo(
    () => groups?.find((g) => g.id === tagsFor?.id) ?? tagsFor,
    [groups, tagsFor],
  )

  const saveMutation = useMutation({
    mutationFn: async (data: any) =>
      selected
        ? axiosInstance.patch(`/admin/service-categories/${selected.id}`, data)
        : axiosInstance.post("/admin/service-categories", data),
    onSuccess: () => {
      invalidate()
      toast({ title: "Success", description: `Service category ${selected ? "updated" : "created"}.` })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save.", variant: "destructive" }),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/service-categories/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Archived", description: "Service category archived." }) },
  })

  const assignMutation = useMutation({
    mutationFn: ({ groupId, categoryId }: { groupId: string; categoryId: string }) =>
      axiosInstance.post(`/admin/service-categories/${groupId}/job-types`, { categoryId }),
    onSuccess: invalidate,
    onError: (err: any) =>
      toast({ title: "Error", description: err.response?.data?.message || "Failed.", variant: "destructive" }),
  })

  const unassignMutation = useMutation({
    mutationFn: ({ groupId, categoryId }: { groupId: string; categoryId: string }) =>
      axiosInstance.delete(`/admin/service-categories/${groupId}/job-types/${categoryId}`),
    onSuccess: invalidate,
  })

  const addTagMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: typeof newTag }) =>
      axiosInstance.post(`/admin/service-categories/${groupId}/tags`, data),
    onSuccess: () => { invalidate(); setNewTag({ tag: "", language: "EN", tagType: "ALIAS" }) },
    onError: (err: any) =>
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add tag.", variant: "destructive" }),
  })

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => axiosInstance.delete(`/admin/service-category-tags/${tagId}`),
    onSuccess: invalidate,
  })

  const resetForm = () => {
    setSelected(null)
    setFormData({ name: "", nameKn: "", nameFr: "", icon: "", description: "", isActive: true, sortOrder: 0 })
  }

  const handleEdit = (g: ServiceCategory) => {
    setSelected(g)
    setFormData({
      name: g.name, nameKn: g.nameKn || "", nameFr: g.nameFr || "",
      icon: g.icon || "", description: g.description || "", isActive: g.isActive, sortOrder: g.sortOrder,
    })
    setIsDialogOpen(true)
  }

  const toggleJobType = (groupId: string, categoryId: string, assigned: boolean) => {
    if (assigned) unassignMutation.mutate({ groupId, categoryId })
    else assignMutation.mutate({ groupId, categoryId })
  }

  const filtered = (groups ?? []).filter((g) =>
    `${g.name} ${g.nameKn || ""} ${g.nameFr || ""}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Categories</h1>
          <p className="text-sm text-muted-foreground">
            Broad groupings that organise your job types. One job type can sit in several groupings.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search groupings..." className="pl-8" value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Add Grouping
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Kinyarwanda</TableHead>
                  <TableHead>Job Types</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs">{g.sortOrder}</TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground">{g.nameKn || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {g.assignments.length === 0
                          ? <span className="text-muted-foreground text-sm">—</span>
                          : g.assignments.slice(0, 4).map((a) => (
                            <Badge key={a.id} variant="secondary" className="font-normal">{a.category.name}</Badge>
                          ))}
                        {g.assignments.length > 4 && (
                          <Badge variant="outline">+{g.assignments.length - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{g.tags?.length || 0}</TableCell>
                    <TableCell>
                      {g.isActive ? <Badge className="bg-green-600">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Manage job types" onClick={() => setJobTypesFor(g)}>
                        <Link2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Search tags" onClick={() => setTagsFor(g)}>
                        <Tags className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEdit(g)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" title="Archive"
                        onClick={() => { if (confirm("Archive this grouping? Job types and their listings are not affected.")) archiveMutation.mutate(g.id) }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No groupings yet. Click "Add Grouping" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / edit grouping */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Grouping" : "New Grouping"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData) }} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kinyarwanda Name</Label>
                <Input value={formData.nameKn} onChange={(e) => setFormData({ ...formData, nameKn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>French Name</Label>
                <Input value={formData.nameFr} onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon (lucide name, e.g. home)</Label>
              <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="home" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
              <Label>Active (visible to users)</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {selected ? "Save Changes" : "Create Grouping"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage job types */}
      <Dialog open={!!jobTypesFor} onOpenChange={(o) => !o && setJobTypesFor(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Types — {liveJobTypesFor?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Tick the job types that belong in this grouping. Changes save instantly.
            </p>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            {(jobTypes ?? []).map((jt) => {
              const assigned = !!liveJobTypesFor?.assignments.some((a) => a.categoryId === jt.id)
              const busy = assignMutation.isPending || unassignMutation.isPending
              return (
                <label key={jt.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/40">
                  <span>
                    <span className="font-medium">{jt.name}</span>
                    {jt.nameKn && <span className="text-muted-foreground text-sm"> · {jt.nameKn}</span>}
                  </span>
                  <Switch checked={assigned} disabled={busy}
                    onCheckedChange={() => liveJobTypesFor && toggleJobType(liveJobTypesFor.id, jt.id, assigned)} />
                </label>
              )
            })}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setJobTypesFor(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags */}
      <Dialog open={!!tagsFor} onOpenChange={(o) => !o && setTagsFor(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Tags — {liveTagsFor?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Aliases, synonyms and translations that help users find this grouping in search.
            </p>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 pt-2">
            {(liveTagsFor?.tags ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            )}
            {(liveTagsFor?.tags ?? []).map((t) => (
              <Badge key={t.id} variant="secondary" className="font-normal gap-1 pr-1">
                {t.tag}
                <span className="text-[10px] uppercase opacity-60">{t.language}</span>
                <button className="ml-1 hover:text-destructive" onClick={() => deleteTagMutation.mutate(t.id)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end pt-4 border-t mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Tag</Label>
              <Input value={newTag.tag} placeholder="e.g. home care"
                onChange={(e) => setNewTag({ ...newTag, tag: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Language</Label>
              <Select value={newTag.language} onValueChange={(v) => setNewTag({ ...newTag, language: v as Lang })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={newTag.tagType} onValueChange={(v) => setNewTag({ ...newTag, tagType: v as TagKind })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{TAG_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button disabled={!newTag.tag.trim() || addTagMutation.isPending || !liveTagsFor}
              onClick={() => liveTagsFor && addTagMutation.mutate({ groupId: liveTagsFor.id, data: newTag })}>
              {addTagMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setTagsFor(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
