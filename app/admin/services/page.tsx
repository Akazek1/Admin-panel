"use client"

import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteService, getAllServices, Service, updateService } from "@/lib/api"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, Layers, User, Filter, Eye, EyeOff, Edit, Trash2, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ServicesPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editing, setEditing] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceMin: "",
    priceMax: "",
    priceType: "",
    serviceAreas: "",
  })

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: getAllServices,
  })

  const filteredServices = services?.filter((service) => {
    const searchStr = `${service.title} ${service.provider.firstName} ${service.category.name}`.toLowerCase()
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && service.isActive) ||
      (statusFilter === "INACTIVE" && !service.isActive)
    return matchesSearch && matchesStatus
  })
  const visible = filteredServices ?? []
  const allVisibleSelected = visible.length > 0 && visible.every((service) => selectedIds.includes(service.id))
  const toggleVisible = (checked: boolean) => {
    const ids = visible.map((service) => service.id)
    setSelectedIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)))
  }

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] })
      toast({ title: "Service updated" })
      setEditing(null)
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Could not update service.", variant: "destructive" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] })
      toast({ title: "Service deleted" })
    },
  })

  const openEdit = (service: Service) => {
    setEditing(service)
    setFormData({
      title: service.title,
      description: service.description,
      priceMin: service.priceMin?.toString() ?? "",
      priceMax: service.priceMax?.toString() ?? "",
      priceType: service.priceType ?? "",
      serviceAreas: service.serviceAreas?.join(", ") ?? "",
    })
  }

  const submitEdit = () => {
    if (!editing) return
    saveMutation.mutate({
      id: editing.id,
      data: {
        title: formData.title,
        description: formData.description,
        priceMin: formData.priceMin ? Number(formData.priceMin) : null,
        priceMax: formData.priceMax ? Number(formData.priceMax) : null,
        priceType: formData.priceType || null,
        serviceAreas: formData.serviceAreas.split(",").map((area) => area.trim()).filter(Boolean),
      },
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Platform Services</h1>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services or providers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                {statusFilter === "ALL" ? "All" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={16}>
              <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>All Services</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("ACTIVE")}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("INACTIVE")}>Inactive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {visible.length} shown · {selectedIds.length} selected
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={() => selectedIds.forEach((id) => saveMutation.mutate({ id, data: { isActive: false } }))}
          >
            Hide Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={() => selectedIds.forEach((id) => saveMutation.mutate({ id, data: { isActive: true } }))}
          >
            Activate Selected
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !filteredServices || filteredServices.length === 0 ? (
            <p className="text-center py-20 text-muted-foreground">No services found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(value) => toggleVisible(!!value)}
                      aria-label="Select visible services"
                    />
                  </TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Service Title</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signals</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(service.id)}
                        onCheckedChange={(value) =>
                          setSelectedIds((prev) =>
                            value ? Array.from(new Set([...prev, service.id])) : prev.filter((id) => id !== service.id)
                          )
                        }
                        aria-label={`Select ${service.title}`}
                      />
                    </TableCell>
                    <TableCell>
                      {service.serviceImage ? (
                        <img 
                          src={service.serviceImage} 
                          alt="" 
                          className="w-12 h-10 rounded object-cover border bg-muted" 
                        />
                      ) : (
                        <div className="w-12 h-10 rounded bg-muted flex items-center justify-center border">
                          <Layers className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{service.title}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{service.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {service.provider.firstName} {service.provider.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {service.priceMin} - {service.priceMax} RWF
                        <p className="text-muted-foreground italic">({service.priceType})</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {service.isActive ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        <span>{service._count?.bookings ?? 0} bookings</span>
                        <span className="mx-1">·</span>
                        <span>{service._count?.reviews ?? 0} reviews</span>
                        <span className="mx-1">·</span>
                        <span>{service._count?.bookmarks ?? 0} saves</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(service.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/users/${service.provider.id}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => saveMutation.mutate({ id: service.id, data: { isActive: !service.isActive } })}
                          title={service.isActive ? "Hide service" : "Activate service"}
                        >
                          {service.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Delete this service listing permanently?")) deleteMutation.mutate(service.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Edit Service Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min Price</Label>
                <Input type="number" value={formData.priceMin} onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max Price</Label>
                <Input type="number" value={formData.priceMax} onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price Type</Label>
                <Input placeholder="hourly, daily, fixed" value={formData.priceType} onChange={(e) => setFormData({ ...formData, priceType: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Areas</Label>
              <Input placeholder="Kigali, Gasabo, Remera" value={formData.serviceAreas} onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit} disabled={saveMutation.isPending || !formData.title.trim()}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
