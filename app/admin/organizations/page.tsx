"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getPendingOrganizations, verifyOrganization, Organization } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, Building2, User, Phone, Mail } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  
  const { data: orgs, isLoading } = useQuery({
    queryKey: ["admin-organizations-pending"],
    queryFn: getPendingOrganizations,
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifyOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations-pending"] })
      toast({ title: "Verified", description: "Organization has been approved." })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to verify organization.",
        variant: "destructive",
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Organization Approvals</h1>
        <Badge variant="secondary">{orgs?.length || 0} Pending</Badge>
      </div>

      {!orgs || orgs.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            No organizations awaiting verification.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orgs.map((org) => (
            <Card key={org.id} className="overflow-hidden border-l-4 border-l-[#145B10]">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{org.name}</h3>
                          <Badge variant="outline" className="mt-1">{org.type.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <User className="h-3 w-3" /> Owner Info
                        </p>
                        <p className="font-medium">{org.owner.firstName} {org.owner.lastName}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {org.phone || org.owner.phoneNumber}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {org.email || org.owner.email || "No email"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase">Address</p>
                        <p className="text-muted-foreground">{org.address || "No address provided"}</p>
                        <p className="text-xs text-muted-foreground mt-2">Submitted {formatDate(org.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6 flex flex-col justify-center items-center gap-3 md:w-64 border-t md:border-t-0 md:border-l">
                    <Button 
                      className="w-full bg-[#145B10] hover:bg-green-800"
                      onClick={() => verifyMutation.mutate(org.id)}
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve Business
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground px-4">
                      Verifying will allow this organization to post jobs and manage staff.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
