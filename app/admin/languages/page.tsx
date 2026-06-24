"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Globe, Pencil } from "lucide-react"

interface Language {
  id: string
  code: string
  name: string
  nativeName: string | null
  hint: string | null
  isActive: boolean
  isDefault: boolean
  sortOrder: number
}

const emptyForm = { code: "", name: "", nativeName: "", hint: "", sortOrder: 0, isActive: false }

export default function LanguagesPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  const { data: languages, isLoading } = useQuery<Language[]>({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/languages")
      return res.data?.data ?? res.data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-languages"] })

  const saveMutation = useMutation({
    mutationFn: (data: typeof formData & { id?: string }) => {
      const payload = { ...data, sortOrder: Number(data.sortOrder) || 0 }
      return editingId
        ? axiosInstance.patch(`/admin/languages/${editingId}`, payload)
        : axiosInstance.post("/admin/languages", payload)
    },
    onSuccess: () => {
      invalidate()
      toast({ title: editingId ? "Updated" : "Added", description: "Language saved." })
      closeDialog()
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to save.", variant: "destructive" })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      axiosInstance.patch(`/admin/languages/${id}`, { isActive }),
    onSuccess: () => invalidate(),
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosInstance.delete(`/admin/languages/${id}`),
    onSuccess: () => {
      invalidate()
      toast({ title: "Deleted" })
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not delete.", variant: "destructive" })
    },
  })

  const openCreate = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const openEdit = (lang: Language) => {
    setEditingId(lang.id)
    setFormData({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName ?? "",
      hint: lang.hint ?? "",
      sortOrder: lang.sortOrder,
      isActive: lang.isActive,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingId(null)
    setFormData(emptyForm)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Languages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Only <span className="font-medium">active</span> languages appear in the app&apos;s language picker. Switch one
            off to hide it from users until it&apos;s ready.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Language
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !languages?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No languages yet</p>
              <p className="text-sm text-muted-foreground">Add one to offer it in the app.</p>
            </div>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Language</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {languages.map((lang) => (
            <Card key={lang.id} className={lang.isActive ? "" : "opacity-70"}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                  {lang.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{lang.name}</p>
                    {lang.nativeName && <span className="text-sm text-muted-foreground">· {lang.nativeName}</span>}
                    {lang.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                  </div>
                  {lang.hint && <p className="text-sm text-muted-foreground mt-0.5">{lang.hint}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 mr-2">
                    <Switch
                      checked={lang.isActive}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: lang.id, isActive: checked })}
                      aria-label={`${lang.isActive ? "Deactivate" : "Activate"} ${lang.name}`}
                    />
                    <span className="text-xs text-muted-foreground w-14">
                      {lang.isActive ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(lang)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive disabled:opacity-40"
                    disabled={lang.isDefault}
                    title={lang.isDefault ? "The default language can't be deleted" : "Delete language"}
                    onClick={() => {
                      if (confirm(`Delete ${lang.name}? Users will no longer see it.`)) deleteMutation.mutate(lang.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Language" : "Add Language"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="EN"
                  maxLength={5}
                  value={formData.code}
                  disabled={!!editingId}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Name (English)</Label>
                <Input
                  placeholder="Kinyarwanda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Native name (optional)</Label>
                <Input
                  placeholder="Ikinyarwanda"
                  value={formData.nativeName}
                  onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hint (optional)</Label>
              <Input
                placeholder="Simple local wording"
                value={formData.hint}
                onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this language in the app picker</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={!formData.code.trim() || !formData.name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Add Language"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
