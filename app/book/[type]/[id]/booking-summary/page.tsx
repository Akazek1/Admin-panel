// app/booking-summary/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Use next/navigation
import BackButtonHeader from "@/components/header/back-button-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Languages, MapPin, Star } from "lucide-react";
import { Icons } from "@/components/icons";

// Define the provider interface
interface Provider {
    id: number;
    image: string;
    name: string;
    title: string;
    experience: string;
    languages: string;
    location: string;
    price: string;
    rating: number;
    reviews: number;
    distance: string;
    available: boolean;
    verified: boolean;
    type: string;
}

const BookingSummary = () => {
    const router = useRouter();
    const searchParams = useSearchParams(); // Use useSearchParams to get query parameters
    const [provider, setProvider] = useState<Provider | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Parse query parameters
    useEffect(() => {
        const providerParam = searchParams.get("provider");
        const date = searchParams.get("date");
        const time = searchParams.get("time");

        if (providerParam && date && time) {
            try {
                setProvider(JSON.parse(decodeURIComponent(providerParam)));
                setSelectedDate(decodeURIComponent(date));
                setSelectedTime(decodeURIComponent(time));
            } catch (error) {
                console.error("Failed to parse provider data:", error);
            }
        }
    }, [searchParams]);

    if (!provider || !selectedDate || !selectedTime) {
        return <div>Loading...</div>;
    }

    // Sample data for "Frequently Added Together"
    const relatedProvider = {
        name: "Mutanguha",
        title: "Electrician",
        experience: "10 Years of Experience",
        languages: "English, Kinyarwanda, Swahili, French",
        location: "Nyamirambo, Kigali",
        price: "3000-5000 rwf/day",
        rating: 4.8,
        reviews: 8289,
        distance: "2 miles",
    };

    // Pricing breakdown
    const itemTotal = 900; // Example: 300 RWF/Hr * 3 hours
    const discount = 100;
    const deliveryFee = 0;
    const grandTotal = itemTotal - discount + deliveryFee;

    return (
        <div className=" flex flex-col bg-[#F1FCEF] overflow-hidden">
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <BackButtonHeader text="Booking Summary" />
                {/* Main Provider */}
                <div className="bg-white rounded-[32px] p-5 space-y-3">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-[60px] h-[60px]">
                            <AvatarImage src={provider.image} />
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
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-[#145B10] font-bold">300 RWF/Hr</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" className="w-8 h-8 rounded-full border-[#145B10] text-[#145B10]">
                                -
                            </Button>
                            <span className="text-[#145B10] font-bold">1</span>
                            <Button variant="outline" className="w-8 h-8 rounded-full border-[#145B10] text-[#145B10]">
                                +
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Frequently Added Together */}
                <h3 className=" font-medium text-[#212121]">Frequently Added Together</h3>
                <div className="bg-white rounded-[32px] p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-3">
                            <h2 className="text-lg font-semibold text-[#1B2431]">{relatedProvider.name}</h2>
                            <p className="text-sm text-[#212121] font-bold">{relatedProvider.title}</p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" /> {relatedProvider.experience}
                            </p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <Languages className="w-4 h-4 text-[#212121]" /> {relatedProvider.languages}
                            </p>
                            <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                                <MapPin className="w-4 h-4 text-[#212121]" /> {relatedProvider.location}
                            </p>
                            <p className="text-[#145B10] font-bold">{relatedProvider.price}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Star className="w-4 h-4 fill-[#FB9400] stroke-[#FB9400]" /> {relatedProvider.rating} | {relatedProvider.reviews} reviews • {relatedProvider.distance}
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
                <div className=" rounded-[32px] p-5 bg-white space-y-3">
                    <div className="flex items-center gap-2 rounded-lg bg-white">
                        <Icons.BagIcon className="w-5 h-5 stroke-black" />
                        <span className="text-[#145B10] font-medium">Apply Coupons</span>
                    </div>
                </div>
                <div className="rounded-[32px] p-5 bg-white space-y-3">
                    <div className="flex justify-between text-[#616161] font-medium">
                        <span>Item Totals</span>
                        <span>{itemTotal} RWF</span>
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
                        <span>{grandTotal} RWF</span>
                    </div>
                </div>
            </main>

            <Button
                className="w-[50%] mx-auto rounded-[100px] font-bold bg-[#145B10] text-white hover:bg-[#145B10]/90"
                onClick={() => router.push("/checkout")} // Navigate to checkout or next step
            >
                Proceed To Checkout
            </Button>
        </div>
    );
};

export default BookingSummary;