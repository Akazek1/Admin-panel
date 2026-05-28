"use client"

import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getBookings, Booking } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  Calendar,
  User,
  MapPin,
  HardHat,
  CheckCircle2,
  Search,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function CompletedBookingsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-completed"],
    queryFn: () => getBookings("COMPLETED"),
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
        <h1 className="text-3xl font-bold tracking-tight">Completed Bookings</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search completed bookings..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {filteredBookings.length} Finished
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allVisibleSelected}
            onCheckedChange={(value) => toggleVisible(!!value)}
            aria-label="Select visible completed bookings"
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
            <p className="text-muted-foreground">No completed bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden border-l-4 border-l-green-500">
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
