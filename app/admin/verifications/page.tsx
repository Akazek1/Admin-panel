"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getPendingVerifications, approveVerification, rejectVerification, VerificationRequest } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle, Eye, GraduationCap, MapPin, Star, Briefcase } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function VerificationsPage() {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: getPendingVerifications,
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] })
      toast({ title: "Approved", description: "Verification approved successfully." })
      setSelectedRequest(null)
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to approve verification.",
        variant: "destructive",
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectVerification(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] })
      toast({ title: "Rejected", description: "Verification rejected." })
      setIsRejectDialogOpen(false)
      setRejectionReason("")
      setSelectedRequest(null)
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reject verification.",
        variant: "destructive",
      })
    },
  })

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id)
    }
  }

  const handleReject = () => {
    if (selectedRequest && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason })
    } else {
      toast({ title: "Reason required", description: "Please provide a reason for rejection." })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Verifications</h1>
        <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
          {requests?.length || 0} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending ID Verifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !requests || requests.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No pending verifications found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.user.firstName} {request.user.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{request.user.phoneNumber}</div>
                      <div className="text-xs text-muted-foreground">{request.user.email}</div>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                          <Eye className="w-4 h-4 mr-2" /> Review
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/admin/verifications/${request.id}`}>Open</Link>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review ID Verification</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profile Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                        {selectedRequest.user.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedRequest.user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-semibold">{selectedRequest.user.firstName} {selectedRequest.user.lastName}</p>
                        <p className="text-muted-foreground">{selectedRequest.user.phoneNumber}</p>
                        <p className="text-muted-foreground">{selectedRequest.user.email || "No email"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p>{selectedRequest.user.gender || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">DOB</p>
                        <p>{selectedRequest.user.dateOfBirth ? formatDate(selectedRequest.user.dateOfBirth) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Education</p>
                        <p>{selectedRequest.user.educationLevel || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> Trust</p>
                        <p>{selectedRequest.user.trustScore ?? 0}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Addresses</p>
                      <div className="mt-1 space-y-1">
                        {selectedRequest.user.addresses?.length ? selectedRequest.user.addresses.map((address: any) => (
                          <p key={address.id}>{[address.sector, address.district, address.city].filter(Boolean).join(", ")}</p>
                        )) : <p>—</p>}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="w-3 h-3" /> Services</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedRequest.user.services?.length ? selectedRequest.user.services.map((service: any) => (
                          <Badge key={service.id} variant="outline">{service.title}</Badge>
                        )) : <span>—</span>}
                      </div>
                    </div>

                    {selectedRequest.user.verificationRequests?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Recent verification history</p>
                        <div className="mt-1 space-y-1">
                          {selectedRequest.user.verificationRequests.map((request: any) => (
                            <div key={request.id} className="rounded border px-2 py-1">
                              <Badge variant="outline" className="text-[10px]">{request.status}</Badge>
                              {request.reviewNote && <p className="mt-1 text-xs text-muted-foreground">{request.reviewNote}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{selectedRequest.document.type}</Badge>
                    <Badge variant="outline">{selectedRequest.document.status}</Badge>
                    <Badge variant="secondary">Submitted {formatDate(selectedRequest.createdAt)}</Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[520px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedRequest.document.documentUrl}
                      alt="Government ID"
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve ID
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setIsRejectDialogOpen(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject ID
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Explain why this ID is being rejected. This will be visible to the worker.
            </p>
            <Textarea
              placeholder="e.g., Image is blurry, expired document, or name doesn't match profile."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
