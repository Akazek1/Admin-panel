"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { getBookings, Booking } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Calendar,
  User,
  MapPin,
  HardHat,
  CheckCircle2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function CompletedBookingsPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-completed"],
    queryFn: () => getBookings("COMPLETED"),
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
        <h1 className="text-3xl font-bold tracking-tight">Completed Bookings</h1>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {bookings?.length || 0} Finished
        </Badge>
      </div>

      {!bookings || bookings.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <p className="text-muted-foreground">No completed bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-green-500">
              <CardHeader className="bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    {booking.service?.title || "Custom Service"}
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">COMPLETED</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Employer</h4>
                    <p className="font-semibold text-sm">
                      {booking.employer.firstName} {booking.employer.lastName}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Provider</h4>
                    <p className="font-semibold text-sm">
                      {booking.worker.firstName} {booking.worker.lastName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-2 border-t">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Location</h4>
                    <p className="text-sm">
                      {booking.address?.city}, {booking.address?.district}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase">Finished On</h4>
                    <p className="text-sm">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t text-right">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Paid:</span>{" "}
                    <span className="font-bold text-green-700">{booking.agreedPrice || 0} RWF</span>
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
