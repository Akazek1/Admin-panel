"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios-instance";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, User, IndianRupee, Clock, Check, X, MapPin, Phone, Mail, Home, HardHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Image from "next/image";

interface Booking {
    id: string;
    serviceId: string;
    userId: string;
    workerId: string;
    addressId: string;
    status: "PENDING" | "APPROVED" | "DISAPPROVED";
    scheduledFor: string;
    price: number;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
    };
    service: {
        id: string;
        title: string;
        serviceImage: string | null;
        serviceAreas: string[];
        serviceType: string;
        price: number;
        provider: {
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
            profilePicture: string;
        };
    };
}

const PendingBookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        setBookings([]);
        setLoading(false);
    }, []);

    const handleApprove = async (id: string) => {
        void id;
        toast.error("Booking management coming soon");
    };

    const handleDisapprove = async (id: string) => {
        void id;
        toast.error("Booking management coming soon");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary">Pending</Badge>;
            case "APPROVED":
                return <Badge className="bg-[#145B10] hover:bg-[#145b10e8]">Approved</Badge>;
            case "DISAPPROVED":
                return <Badge className="bg-red-500 hover:bg-red-600">Disapproved</Badge>;
            case "COMPLETED":
                return <Badge className="bg-[#145B10] hover:bg-[#145b10ee]">Completed</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto px-4 py-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Pending Bookings</h1>
                    <div className="text-sm text-muted-foreground">
                        {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <p className="text-muted-foreground">No pending bookings found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/50 p-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl flex items-center gap-2 capitalize">
                                            <HardHat className="h-5 w-5" />
                                            {booking.service.title}
                                        </CardTitle>
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(booking.status)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="grid md:grid-cols-2 gap-6 p-6">
                                        {/* Customer Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Customer Details
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Name:</span>
                                                    <span>
                                                        {booking.user.firstName} {booking.user.lastName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{booking.user.phoneNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span>{booking.user.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Provider Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <HardHat className="h-5 w-5" />
                                                Service Provider
                                            </h3>
                                            <div className="flex items-start gap-3">
                                                {booking.service.provider.profilePicture && (
                                                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                                        <Image
                                                            src={booking.service.provider.profilePicture}
                                                            alt="Provider"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-1 text-sm">
                                                    <div className="font-medium">
                                                        {booking.service.provider.firstName} {booking.service.provider.lastName}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="h-3 w-3" />
                                                        <span>{booking.service.provider.phoneNumber}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span>{booking.service.provider.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Service Details */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Home className="h-5 w-5" />
                                                Service Details
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Type:</span>
                                                    <span>{booking.service.serviceType}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Service Areas:</span>
                                                    <span>{booking.service.serviceAreas.join(", ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">Price:</span>
                                                    <span className="flex items-center">
                                                        {booking.service.price}/RWF
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Booking Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Calendar className="h-5 w-5" />
                                                Booking Information
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        Scheduled for: {format(new Date(booking.scheduledFor), "PPPp")}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span>
                                                        Created: {format(new Date(booking.createdAt), "PPPp")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.status === "PENDING" && (
                                        <div className="border-t bg-muted/50 p-4 flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                className="gap-1"
                                                onClick={() => handleDisapprove(booking.id)}
                                                disabled={processing === booking.id}
                                            >
                                                {processing === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <X className="h-4 w-4" />
                                                        Disapprove
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                className="gap-1"
                                                onClick={() => handleApprove(booking.id)}
                                                disabled={processing === booking.id}
                                            >
                                                {processing === booking.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="h-4 w-4" />
                                                        Approve
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <ToastContainer position="bottom-right" />
        </div>
    );
};

export default PendingBookingsPage;