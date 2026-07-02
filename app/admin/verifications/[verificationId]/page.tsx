"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  approveVerification,
  getVerification,
  rejectVerification,
  VerificationRequest,
} from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  GraduationCap,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react"

function displayName(request: VerificationRequest) {
  return [request.user.firstName, request.user.lastName].filter(Boolean).join(" ") || "Unnamed user"
}

export default function VerificationDetailPage() {
  const params = useParams<{ verificationId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [rejectionReason, setRejectionReason] = useState("")

  const verificationId = params.verificationId
  const { data: request, isLoading } = useQuery({
    queryKey: ["verification", verificationId],
    queryFn: () => getVerification(verificationId),
    enabled: !!verificationId,
  })

  const isPending = request?.status ? request.status === "PENDING" : true

  const approveMutation = useMutation({
    mutationFn: () => approveVerification(verificationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["verification", verificationId] }),
        queryClient.invalidateQueries({ queryKey: ["pending-verifications"] }),
      ])
      toast({ title: "Approved", description: "Verification approved successfully." })
      router.push("/admin/verifications")
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
    mutationFn: () => rejectVerification(verificationId, rejectionReason.trim()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["verification", verificationId] }),
        queryClient.invalidateQueries({ queryKey: ["pending-verifications"] }),
      ])
      toast({ title: "Rejected", description: "Verification rejected." })
      router.push("/admin/verifications")
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reject verification.",
        variant: "destructive",
      })
    },
  })

  const reviewerName = useMemo(() => {
    if (!request?.reviewer) return null
    return [request.reviewer.firstName, request.reviewer.lastName].filter(Boolean).join(" ") || request.reviewer.email
  }, [request])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="p-6">
        <Button asChild variant="outline">
          <Link href="/admin/verifications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="mt-8 text-muted-foreground">Verification request not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/verifications">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to queue
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verification Review</h1>
            <p className="text-muted-foreground">{displayName(request)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={isPending ? "secondary" : "outline"}>{request.status || "PENDING"}</Badge>
          <Badge variant="outline">Submitted {formatDate(request.createdAt)}</Badge>
          {reviewerName && <Badge variant="outline">Reviewed by {reviewerName}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-muted">
                {request.user.profilePicture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={request.user.profilePicture} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-semibold">{displayName(request)}</p>
                <p className="text-muted-foreground">{request.user.phoneNumber}</p>
                <p className="text-muted-foreground">{request.user.email || "No email"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Gender</p>
                <p>{request.user.gender || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DOB</p>
                <p>{request.user.dateOfBirth ? formatDate(request.user.dateOfBirth) : "Not provided"}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GraduationCap className="h-3 w-3" />
                  Education
                </p>
                <p>{request.user.educationLevel || "Not provided"}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  Trust
                </p>
                <p>{request.user.trustScore ?? 0}</p>
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                Addresses
              </p>
              <div className="mt-1 space-y-1">
                {request.user.addresses?.length ? (
                  request.user.addresses.map((address: any) => (
                    <p key={address.id}>{[address.sector, address.district, address.city].filter(Boolean).join(", ")}</p>
                  ))
                ) : (
                  <p>Not provided</p>
                )}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                Services
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {request.user.services?.length ? (
                  request.user.services.map((service: any) => (
                    <Badge key={service.id} variant="outline">
                      {service.category?.name}
                    </Badge>
                  ))
                ) : (
                  <span>Not provided</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" />
              Submitted Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{request.document?.type || "Document"}</Badge>
              <Badge variant="outline">{request.document?.status || "Unknown status"}</Badge>
              {request.document?.documentFileName && <Badge variant="secondary">{request.document.documentFileName}</Badge>}
            </div>
            <div className="flex min-h-[620px] items-center justify-center overflow-hidden rounded-md border bg-muted">
              {request.document?.documentUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={request.document.documentUrl} alt="Submitted ID document" className="max-h-[78vh] max-w-full object-contain" />
              ) : (
                <p className="text-muted-foreground">No document image available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPending && (
                <p className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
                  This request has already been reviewed.
                </p>
              )}
              {request.reviewNote && (
                <div>
                  <p className="text-xs text-muted-foreground">Review note</p>
                  <p className="mt-1 rounded-md border p-3 text-sm">{request.reviewNote}</p>
                </div>
              )}
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate()}
                disabled={!isPending || approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Approve ID
              </Button>
              <Textarea
                placeholder="Rejection reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={4}
                disabled={!isPending || rejectMutation.isPending}
              />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast({ title: "Reason required", description: "Please provide a reason for rejection." })
                    return
                  }
                  rejectMutation.mutate()
                }}
                disabled={!isPending || approveMutation.isPending || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject ID
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {request.user.verificationRequests?.length ? (
                request.user.verificationRequests.map((item: any) => (
                  <div key={item.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                    </div>
                    {item.reviewNote && <p className="mt-2 text-muted-foreground">{item.reviewNote}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No previous verification history.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
