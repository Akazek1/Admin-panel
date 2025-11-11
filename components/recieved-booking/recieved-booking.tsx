'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

// Define the booking interface based on the provided object
interface Booking {
    id: string;
    service: {
        id: string;
        title: string;
        description: string;
        price: number;
        providerId: string;
        workerId: string;
        category: string;
        serviceType: string;
        serviceAreas: string[];
        serviceImage: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        provider: {
            id: string;
            phoneNumber: string;
            firstName: string;
            lastName: string;
            email: string;
            userType: string;
            profilePicture: string;
        };
    };
    address: {
        id: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
        userId: string;
        createdAt: string;
        updatedAt: string;
    };
    status: string;
    scheduledFor: string;
    price: number;
    createdAt: string;
    updatedAt: string;
    worker: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        gender: string;
        languages: string[];
        dateOfBirth: string;
    };
    receiver: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
        userType: string;
        profilePicture: string;
    };
}

interface ApiResponse {
    data: Booking[];
}

interface RecievedBookingsProps {
    title?: string;
    emptyMessage?: string;
}

const RecievedBookings: React.FC<RecievedBookingsProps> = ({ 
    title = "Received Bookings",
    emptyMessage = "No bookings found."
}) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await api.get<ApiResponse>('/bookings/received', {
                    withCredentials: true,
                });
                setBookings(response.data.data);
                setError(null);
            } catch (error: any) {
                // Silently handle 404 - endpoint not implemented yet
                if (error?.response?.status === 404) {
                    setBookings([]);
                } else {
                    setError('Failed to fetch bookings');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto pb-8">
            <h1 className="text-2xl font-bold mb-4">{title}</h1>
            {bookings.length === 0 ? (
                <p className="text-gray-500">{emptyMessage}</p>
            ) : (
                <div className="grid gap-2 grid-cols-2">
                    {bookings.map((booking) => (
                        <div
                            key={booking.id}
                            className="border rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md transition"
                            onClick={() => router.push(`/recieved-bookings/${booking.id}`)}
                        >
                            <Image
                                width={300}
                                height={300}
                                src={booking.service.serviceImage}
                                alt={booking.service.title}
                                className="w-full h-32 object-cover rounded-md"
                            />
                            <div className='p-2'>
                                <p className="font-semibold capitalize text-xs">Receiver: {booking.receiver.firstName} {booking.receiver.lastName}</p>
                                <h2 className="text-gray-600 text-xs capitalize">{booking.service.title}</h2>
                                <p className="text-gray-600 text-xs line-clamp-1">Scheduled: {new Date(booking.scheduledFor).toLocaleString()}</p>
                                <p className="text-[#145B10] font-medium text-xs">Status: {booking.status}</p>
                                <p className="text-gray-600 text-xs">Price: ${booking.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecievedBookings;