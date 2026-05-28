"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBookings, overrideBooking, updateBookingStatus, Booking } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  Calendar,
  User,
  Clock,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Home,
  HardHat,
  Search,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function PendingBookingsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [overrideTarget, setOverrideTarget] = useState<Booking | null>(null)
  const [overrideStatus, setOverrideStatus] = useState("CONFIRMED")
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideNote, setOverrideNote] = useState("")
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-pending"],
    queryFn: () => getBookings("PENDING"),
  })

  const filteredBookings = (bookings ?? []).filter((booking) => {
    const searchStr = `${booking.service?.title || ""} ${booking.employer.firstName || ""} ${booking.employer.lastName || ""} ${booking.worker.firstName || ""} ${booking.worker.lastName || ""}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })
  const allVisibleSelected =
    filteredBookings.length > 0 && filteredBookings.every((booking) => selectedIds.includes(booking.id))
  const toggleVisible = (checked: boolean) => {
    const ids = filteredBookings.map((booking) => booking.id)
    setSelectedIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((id) => !ids.includes(id)))
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-pending"] })
      toast({ title: "Booking Updated", description: "Status changed successfully." })
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update booking.",
        variant: "destructive",
      })
    },
  })

  const overrideMutation = useMutation({
    mutationFn: () =>
      overrideBooking(overrideTarget!.id, {
        status: overrideStatus,
        reason: overrideReason,
        note: overrideNote,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-pending"] })
      toast({ title: "Booking override applied" })
      setOverrideTarget(null)
      setOverrideReason("")
      setOverrideNote("")
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Override failed.", variant: "destructive" })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pending Bookings</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="secondary">{filteredBookings.length} Total</Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(value) => toggleVisible(!!value)}
            aria-label="Select visible bookings"
          />
          Select visible
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
          <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
            Review Selected
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No pending bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-yellow-500">
              <CardHeader className="bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.includes(booking.id)}
                      onCheckedChange={(value) =>
                        setSelectedIds((prev) =>
                          value ? Array.from(new Set([...prev, booking.id])) : prev.filter((id) => id !== booking.id)
                        )
                      }
                      aria-label={`Select booking ${booking.id}`}
                    />
                    <HardHat className="h-5 w-5 text-primary" />
                    {booking.service?.title || "Custom Service"}
                  </CardTitle>
                  <Badge variant="outline">PENDING</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Employer */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <User className="h-3 w-3" /> Employer
                    </h4>
                    <p className="font-semibold text-sm">
                      {booking.employer.firstName} {booking.employer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{booking.employer.phoneNumber}</p>
                  </div>

                  {/* Provider */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <HardHat className="h-3 w-3" /> Provider
                    </h4>
                    <p className="font-semibold text-sm">
                      {booking.worker.firstName} {booking.worker.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{booking.worker.phoneNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2 border-t">
                  {/* Location */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location
                    </h4>
                    <p className="text-sm">
                      {booking.address?.city}, {booking.address?.district}
                    </p>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Scheduled
                    </h4>
                    <p className="text-sm">
                      {booking.scheduledFor ? formatDate(booking.scheduledFor) : "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Agreed Price:</span>{" "}
                    <span className="font-bold text-primary">{booking.agreedPrice || 0} RWF</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => statusMutation.mutate({ id: booking.id, status: "CANCELLED" })}
                      disabled={statusMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => statusMutation.mutate({ id: booking.id, status: "CONFIRMED" })}
                      disabled={statusMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideTarget(booking)
                        setOverrideStatus("CONFIRMED")
                      }}
                    >
                      Override
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!overrideTarget} onOpenChange={(open) => !open && setOverrideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Booking Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Use this when a booking is stuck or support has confirmed the correct status with both parties.
            </p>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. Employer confirmed by phone" />
            </div>
            <div className="space-y-2">
              <Label>Internal Note</Label>
              <Textarea value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>Cancel</Button>
            <Button disabled={!overrideReason.trim() || overrideMutation.isPending} onClick={() => overrideMutation.mutate()}>
              {overrideMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
