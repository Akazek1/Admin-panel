/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import BackButtonHeader from "@/components/header/back-button-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Calendar, Languages, MapPin, Star } from "lucide-react";
import { Icons } from "@/components/icons";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Provider, Service } from "@/types";



// Define the address interface
interface Address {
    id: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}



const BookingSummary = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isLoadingService, setIsLoadingService] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch service details and set provider
    useEffect(() => {
        const serviceId = params.id as string;
        const date = searchParams.get("date");
        const time = searchParams.get("time");

        if (!serviceId) {
            toast.error("Invalid service ID");
            setIsLoadingService(false);
            return;
        }

        if (!date || !time) {
            toast.error("Missing date or time");
            setIsLoadingService(false);
            return;
        }

        setSelectedDate(decodeURIComponent(date));
        setSelectedTime(decodeURIComponent(time));

        const fetchService = async () => {
            try {
                setIsLoadingService(true);
                const response = await api.get(`/services/${serviceId}`);
                const service: Service = response.data.data;

                // Map service to provider
                const mappedProvider: Provider = {
                    id: service.id,
                    image: service.serviceImage,
                    name: `${service.provider.firstName} ${service.provider.lastName}`,
                    title: service.title,
                    experience: service.description || "No experience provided",
                    languages: Array.isArray(service?.worker?.languages) && service.worker.languages.join(", ") || "",
                    location: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.serviceAreas || "",
                    price: `${service.price} RWF/day`,
                    rating: 4.8,
                    reviews: 8289,
                    distance: "2 miles",
                    available: true,
                    verified: true,
                    type: service.provider.userType === "AGENCY" ? "Agency" : "Professional",
                };

                setProvider(mappedProvider);
            } catch (error) {
                console.error("Failed to fetch service data:", error);
                toast.error("Failed to load service details");
            } finally {
                setIsLoadingService(false);
            }
        };

        fetchService();
    }, [searchParams, params]);

    // Fetch addresses from /users/profile
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                setIsLoadingAddresses(true);
                const response = await api.get("/users/profile");
                const addressesData = response.data.data?.addresses || response.data.addresses || [];
                setAddresses(addressesData);
                const defaultAddress = addressesData.find((addr: Address) => addr.isDefault);
                setSelectedAddressId(defaultAddress ? defaultAddress.id : addressesData[0]?.id || null);
            } catch (err) {
                console.error("Error fetching addresses:", err);
                toast.error("Failed to fetch addresses");
            } finally {
                setIsLoadingAddresses(false);
            }
        };
        fetchAddresses();
    }, []);

    // Handle address selection
    const handleAddressChange = (value: string) => {
        setSelectedAddressId(value);
    };

    // Convert selectedDate and selectedTime to ISO datetime
    const getScheduledFor = (date: string, time: string): string => {
        // Parse time (e.g., "10:00am" or "1:00pm")
        const timeMatch = time.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (!timeMatch) throw new Error("Invalid time format");

        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];
        const period = timeMatch[3].toLowerCase();

        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;

        // Construct ISO datetime
        return `${date}T${hours.toString().padStart(2, "0")}:${minutes}:00.000Z`;
    };

    // Handle proceed to checkout
    const handleProceedToCheckout = async () => {
        if (!selectedAddressId) {
            toast.error("Please select a service address");
            return;
        }
        if (!provider || !selectedDate || !selectedTime) {
            toast.error("Booking details are incomplete");
            return;
        }

        setIsSubmitting(true);
        try {
            const scheduledFor = getScheduledFor(selectedDate, selectedTime);
            const payload = {
                serviceId: provider.id.toString(),
                addressId: selectedAddressId,
                scheduledFor,
            };
            console.log(payload);


            const response = await api.post("/bookings", payload);
            if (response.status === 201) {
                toast.success("Booking created successfully");
                router.push(`/`);
            }
        } catch (err) {
            console.error("Error creating booking:", err);
            const errorMessage =
                (err as any).response?.data?.message || "Failed to create booking";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingService || !provider || !selectedDate || !selectedTime) {
        return (
            <div className="min-h-screen bg-[#F1FCEF] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
            </div>
        );
    }

    // Sample data for "Frequently Added Together"
    const relatedProvider = {
        name: "Mutanguha",
        title: "Electrician",
        experience: "10 Years of Experience",
        languages: "English, Kinyarwanda, Swahili, French",
        location: "Nyamirambo, Kigali",
        price: "3000-5000 RWF/day",
        rating: 4.8,
        reviews: 8289,
        distance: "2 miles",
    };

    // Pricing breakdown
    const discount = 0;
    const deliveryFee = 0;
    // const grandTotal = itemTotal - discount + deliveryFee;

    return (
        <div className="flex flex-col bg-[#F1FCEF] overflow-hidden pb-16">
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <BackButtonHeader text="Booking Summary" />

                {/* Main Provider */}
                <div className="bg-white rounded-[32px] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-[60px] h-[60px]">
                            <AvatarImage src={provider.image} className="object-cover" />
                            <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-[#1B2431]">{provider.name}</h2>
                            <p className="text-sm text-[#212121] font-bold">{provider.title}</p>
                        </div>
                    </div>
                    <p className="text-[#616161] text-sm font-semibold">
                        <strong className="font-bold text-[#212121] text-lg">Description</strong>
                        <br />
                        {provider.experience}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-[#145B10] font-bold">{provider.price}</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                className="w-[22px] h-[28px]  border-[1.5px] border-[#145B10] text-[#145B10] rounded-none"
                            >
                                <ArrowDown />
                            </Button>
                            <span className="text-[#145B10] font-bold">1</span>
                            <Button
                                variant="outline"
                                className="w-[22px] h-[28px] border-[1.5px] border-[#145B10] text-[#145B10] rounded-none"
                            >
                                <ArrowUp />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Frequently Added Together */}
                <h3 className="font-medium text-[#212121]">Frequently Added Together</h3>
                <div className="bg-white rounded-[32px] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-3">
                            <h2 className="text-lg font-semibold text-[#1B2431]">{relatedProvider.name}</h2>
                            <p className="text-sm text-[#212121] font-bold">{relatedProvider.title}</p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" />
                                {relatedProvider.experience}
                            </p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <Languages className="w-4 h-4 text-[#212121]" />
                                {relatedProvider.languages}
                            </p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <MapPin className="w-4 h-4 text-[#212121]" />
                                {relatedProvider.location}
                            </p>
                            <p className="text-[#145B10] font-bold">{relatedProvider.price}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-[#FB9400] stroke-[#FB9400]" />
                                {relatedProvider.rating} | {relatedProvider.reviews} reviews • {relatedProvider.distance}
                            </p>
                        </div>
                    </div>
                    <div className="w-full flex justify-end">
                        <Button className="rounded-[100px] font-bold bg-[#145B10] text-white hover:bg-[#145B10]/90">
                            Add Service
                        </Button>
                    </div>
                </div>

                {/* Booking Details */}
                <h3 className="text-[#212121] font-medium">Booking Details</h3>
                <div className="rounded-[32px] p-5 bg-white space-y-3">
                    {/* Address Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-[#212121]" />
                            <span className="text-[#145B10] font-medium">Service Address</span>
                        </div>
                        {isLoadingAddresses ? (
                            <div className="bg-[#F1FCEF] flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
                            </div>
                        ) : addresses.length === 0 ? (
                            <p className="text-[#616161] text-sm font-medium">
                                No addresses found.{" "}
                                <Link href="/address-book" className="text-[#145B10] underline">
                                    Add an address
                                </Link>
                            </p>
                        ) : (
                            <Select value={selectedAddressId || undefined} onValueChange={handleAddressChange}>
                                <SelectTrigger className="bg-white text-sm font-semibold rounded-lg py-3 border-none focus:ring-2 focus:ring-[#145B10] w-full">
                                    <SelectValue placeholder="Select an address" />
                                </SelectTrigger>
                                <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
                                    {addresses.map((address) => (
                                        <SelectItem key={address.id} value={address.id}>
                                            {`${address.street}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}${address.isDefault ? " (Default)" : ""
                                                }`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 rounded-lg bg-white">
                        <Calendar className="w-5 h-5 stroke-black" />
                        <span className="text-[#145B10] font-medium">
                            {selectedDate} at {selectedTime}
                        </span>
                    </div>

                    {/* Coupon */}
                    <div className="flex items-center gap-2 rounded-lg bg-white">
                        <Icons.BagIcon className="w-5 h-5 stroke-black" />
                        <span className="text-[#145B10] font-medium">Apply Coupons</span>
                    </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="rounded-[32px] p-5 bg-white space-y-3">
                    <div className="flex justify-between text-[#616161] font-medium">
                        <span>Item Totals</span>
                        <span>{provider.price}</span>
                    </div>
                    <div className="flex justify-between text-[#616161] font-medium">
                        <span>Discounts</span>
                        <span>{discount} RWF</span>
                    </div>
                    <div className="flex justify-between text-[#616161] font-medium">
                        <span>Delivery Fee</span>
                        <span>{deliveryFee} RWF</span>
                    </div>
                    <div className="flex justify-between text-[#1B2431] font-bold">
                        <span>Grand Total</span>
                        <span>{provider.price}</span>
                    </div>
                </div>
            </main>

            <Button
                className="w-[50%] mx-auto rounded-[100px] font-bold bg-[#145B10] text-white hover:bg-[#145B10]/90"
                onClick={handleProceedToCheckout}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Proceed To Checkout"
                )}
            </Button>
        </div>
    );
};

export default BookingSummary;