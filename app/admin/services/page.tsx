"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getAllServices, Service } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Layers, User } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: getAllServices,
  })

  const filteredServices = services?.filter((service) => {
    const searchStr = `${service.title} ${service.provider.firstName} ${service.category.name}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Platform Services</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services or providers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  <TableHead>Service Title</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="font-medium">{service.title}</span>
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
                    <TableCell className="text-sm">
                      {formatDate(service.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
