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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { IconField, IconGlyph } from "@/components/icon-field"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { BriefcaseBusiness, ImagePlus, Layers, Loader2, Plus, Edit, Trash2, Settings2, X, Search, ShieldCheck } from "lucide-react"

export interface CategoryField {
  key: string
  label: string
  type: "text" | "number" | "boolean" | "select" | "textarea"
  required: boolean
  isActive?: boolean
  options?: string[]
}

export interface Category {
  id: string
  name: string
  nameKn: string | null
  nameFr: string | null
  providerLabel: string | null
  providerLabelKn: string | null
  providerLabelFr: string | null
  icon: string | null
  description: string | null
  isActive: boolean
  sortOrder: number
  fieldSchema: CategoryField[] | null
}

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "select", label: "Dropdown" },
  { value: "textarea", label: "Long text" },
]

const emptyField = (): CategoryField => ({
  key: "",
  label: "",
  type: "text",
  required: false,
  isActive: true,
  options: [],
})

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
  const [fieldSchemaCategory, setFieldSchemaCategory] = useState<Category | null>(null)
  const [fields, setFields] = useState<CategoryField[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: "", nameKn: "", nameFr: "", providerLabel: "", providerLabelKn: "", providerLabelFr: "", icon: "", description: "", isActive: true, sortOrder: 0,
  })

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/categories")
      const result = res.data?.data ?? res.data
      return Array.isArray(result) ? result : (result?.data ?? [])
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedCategory) {
        return axiosInstance.patch(`/admin/categories/${selectedCategory.id}`, data)
      }
      return axiosInstance.post("/admin/categories", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      toast({ title: "Success", description: `Service type ${selectedCategory ? "updated" : "created"}.` })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      toast({ title: "Deleted", description: "Service type removed." })
    },
  })

  const fieldSchemaMutation = useMutation({
    mutationFn: (data: { id: string; fieldSchema: CategoryField[] }) =>
      axiosInstance.patch(`/admin/categories/${data.id}/field-schema`, { fieldSchema: data.fieldSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      toast({ title: "Saved", description: "Field schema updated." })
      setIsFieldDialogOpen(false)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save schema.", variant: "destructive" })
    },
  })

  const resetForm = () => {
    setSelectedCategory(null)
    setFormData({ name: "", nameKn: "", nameFr: "", providerLabel: "", providerLabelKn: "", providerLabelFr: "", icon: "", description: "", isActive: true, sortOrder: 0 })
  }

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat)
    setFormData({
      name: cat.name, nameKn: cat.nameKn || "", nameFr: cat.nameFr || "",
      providerLabel: cat.providerLabel || "", providerLabelKn: cat.providerLabelKn || "", providerLabelFr: cat.providerLabelFr || "",
      icon: cat.icon || "", description: cat.description || "", isActive: cat.isActive, sortOrder: cat.sortOrder,
    })
    setIsDialogOpen(true)
  }

  const handleOpenFieldBuilder = (cat: Category) => {
    setFieldSchemaCategory(cat)
    setFields(cat.fieldSchema ? [...cat.fieldSchema] : [])
    setIsFieldDialogOpen(true)
  }

  const updateField = (index: number, patch: Partial<CategoryField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f))
  }

  const addField = () => setFields(prev => [...prev, emptyField()])

  const removeField = (index: number) => setFields(prev => prev.filter((_, i) => i !== index))

  const filteredCategories = (categories ?? []).filter((cat) => {
    const searchStr = `${cat.name} ${cat.nameKn || ""} ${cat.nameFr || ""}`.toLowerCase()
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && cat.isActive) ||
      (statusFilter === "INACTIVE" && !cat.isActive)
    return matchesSearch && matchesStatus
  })
  const activeCount = (categories ?? []).filter((cat) => cat.isActive).length
  const withFieldsCount = (categories ?? []).filter((cat) => (cat.fieldSchema?.length ?? 0) > 0).length
  const totalFieldCount = (categories ?? []).reduce((sum, cat) => sum + (cat.fieldSchema?.length ?? 0), 0)
  const mostConfigured = useMemo(() => {
    return [...(categories ?? [])].sort((a, b) => (b.fieldSchema?.length ?? 0) - (a.fieldSchema?.length ?? 0))[0]
  }, [categories])
  const allVisibleSelected =
    filteredCategories.length > 0 && filteredCategories.every((cat) => selectedIds.includes(cat.id))
  const toggleVisible = (checked: boolean) => {
    const ids = filteredCategories.map((cat) => cat.id)
    setSelectedIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)))
  }

  const handleSaveFields = () => {
    // Auto-generate key from label if missing
    const normalised = fields.map(f => ({
      ...f,
      isActive: f.isActive ?? true,
      key: f.key || f.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    }))
    if (!fieldSchemaCategory) return
    fieldSchemaMutation.mutate({ id: fieldSchemaCategory.id, fieldSchema: normalised })
  }

  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1780px] space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Service Types</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The admin catalog users choose from when creating provider listings. Groupings only help users browse these types.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search service types..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Add Service Type
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-white/5 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300"><BriefcaseBusiness className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold">{categories?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Service types</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-300"><ShieldCheck className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Available to users</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-300"><Layers className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold">{totalFieldCount}</p>
              <p className="text-sm text-muted-foreground">Creation fields</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-card/70 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-300"><ImagePlus className="h-5 w-5" /></span>
            <div>
              <p className="text-2xl font-semibold">{withFieldsCount}</p>
              <p className="truncate text-sm text-muted-foreground">Types with custom fields</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-white/5 bg-card/70 p-4 text-sm text-muted-foreground lg:grid-cols-3">
        <div>
          <p className="font-medium text-foreground">Current backend-backed controls</p>
          <p className="mt-1">Name, translations, icon, description, active status, sort order, and custom service fields.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Next catalog controls to persist</p>
          <p className="mt-1">Default image, default description, allowed provider type, and maximum user-uploaded photos.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Most configured type</p>
          <p className="mt-1">{mostConfigured ? `${mostConfigured.name} · ${mostConfigured.fieldSchema?.length ?? 0} fields` : "No service types yet"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-card/70 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {filteredCategories.length} shown · {selectedIds.length} selected
        </p>
        <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
          Review Selected
        </Button>
      </div>

      <Card className="border-white/5 bg-card/70 shadow-sm shadow-black/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(value) => toggleVisible(!!value)}
                      aria-label="Select visible categories"
                    />
                  </TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Kinyarwanda</TableHead>
                  <TableHead>Creation Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(cat.id)}
                        onCheckedChange={(value) =>
                          setSelectedIds((prev) =>
                            value ? Array.from(new Set([...prev, cat.id])) : prev.filter((id) => id !== cat.id)
                          )
                        }
                        aria-label={`Select ${cat.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xl"><IconGlyph value={cat.icon} /></TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {cat.name}
                        {cat.providerLabel && (
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                            {cat.providerLabel}
                          </span>
                        )}
                      </p>
                      <p className="line-clamp-1 max-w-[340px] text-xs text-muted-foreground">{cat.description || "No default description yet"}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cat.nameKn || "—"}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {cat.fieldSchema?.length
                          ? `${cat.fieldSchema.filter((field) => field.isActive !== false).length}/${cat.fieldSchema.length} active`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {cat.isActive
                        ? <Badge className="bg-green-600">Active</Badge>
                        : <Badge variant="secondary">Disabled</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{cat.sortOrder}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Edit card fields" onClick={() => handleOpenFieldBuilder(cat)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm("Delete this service type? Existing listings may still reference it.")) deleteMutation.mutate(cat.id)
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Service type info dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Edit Service Type" : "New Service Type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(formData) }} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kinyarwanda Name</Label>
                <Input value={formData.nameKn} onChange={e => setFormData({ ...formData, nameKn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>French Name</Label>
                <Input value={formData.nameFr} onChange={e => setFormData({ ...formData, nameFr: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Provider Role Label</Label>
              <Input value={formData.providerLabel} onChange={e => setFormData({ ...formData, providerLabel: e.target.value })} placeholder='The role noun for this service, e.g. "Cleaner" for "Cleaning"' />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider Role (Kinyarwanda)</Label>
                <Input value={formData.providerLabelKn} onChange={e => setFormData({ ...formData, providerLabelKn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Provider Role (French)</Label>
                <Input value={formData.providerLabelFr} onChange={e => setFormData({ ...formData, providerLabelFr: e.target.value })} />
              </div>
            </div>
            <IconField value={formData.icon} onChange={(icon) => setFormData({ ...formData, icon })} />
            <div className="space-y-2">
              <Label>Default Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="rounded-lg border border-dashed border-white/10 bg-muted/20 p-3 text-xs text-muted-foreground">
              Default picture, allowed provider type, and maximum uploaded photos need backend fields before they can be saved here.
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={formData.isActive} onCheckedChange={checked => setFormData({ ...formData, isActive: checked })} />
              <Label>Active (Visible to users)</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {selectedCategory ? "Save Changes" : "Create Service Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Field schema builder dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Creation Fields — {fieldSchemaCategory?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Define extra questions providers answer when creating this service type.
            </p>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 border rounded-md border-dashed">
                No fields yet. Click "Add Field" to start.
              </p>
            )}

            {fields.map((field, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                <Button
                  variant="ghost" size="icon"
                  className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeField(i)}
                >
                  <X className="w-3 h-3" />
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Label (shown to worker)</Label>
                    <Input
                      placeholder="e.g. Years of Experience"
                      value={field.label}
                      onChange={e => updateField(i, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Field type</Label>
                    <Select value={field.type} onValueChange={v => updateField(i, { type: v as CategoryField["type"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {field.type === "select" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      placeholder="e.g. Infant, Toddler, School-age"
                      value={field.options?.join(", ") || ""}
                      onChange={e => updateField(i, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.required}
                      onCheckedChange={v => updateField(i, { required: v })}
                    />
                    <Label className="text-xs">Required</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={field.isActive ?? true}
                      onCheckedChange={v => updateField(i, { isActive: v })}
                    />
                    <Label className="text-xs">Active for this job type</Label>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addField}>
              <Plus className="w-4 h-4 mr-2" /> Add Field
            </Button>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFields} disabled={fieldSchemaMutation.isPending}>
              {fieldSchemaMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Fields
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
