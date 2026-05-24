"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getBookings, updateBookingStatus, Booking } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"

export default function PendingBookingsPage() {
  const queryClient = useQueryClient()
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-pending"],
    queryFn: () => getBookings("PENDING"),
  })

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Pending Bookings</h1>
        <Badge variant="secondary">{bookings?.length || 0} Total</Badge>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No pending bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-yellow-500">
              <CardHeader className="bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
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
                      onClick={() => statusMutation.mutate({ id: booking.id, status: "ACCEPTED" })}
                      disabled={statusMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
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
