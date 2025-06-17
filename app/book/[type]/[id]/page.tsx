"use client";

import BackButtonHeader from "@/components/header/back-button-header";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Languages, MapPin, MessageCircleMore, Phone, Share } from "lucide-react";
import ServiceProvider from "@/components/home/service-providers";
import { motion } from "framer-motion";
import SlotSelectionDialog from "@/components/slot-selection-dialog";
import { useParams } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import ReviewSection from "@/components/review-section";
import { useBookmark } from "@/context/bookmark-context";

// Define the provider interface (aligned with ServiceProvider)
interface Provider {
  id: string;
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

// Define the service interface (aligned with ServiceProvider)
interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: "AGENCY" | "INDIVIDUAL";
  };
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Sample date and time data
const availableDates = [
  { day: "Tue", date: 18 },
  { day: "Wed", date: 19 },
  { day: "Thu", date: 20 },
  { day: "Fri", date: 21 },
];

const availableTimes = ["10:00am", "10:59am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm"];

const Page = () => {
  const router = useParams();
  const id = router.id as string; // Get the service ID from the URL
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark, isLoading } = useBookmark("services");

  // Fetch service details from API
  useEffect(() => {
    const fetchService = async () => {
      if (!id || typeof id !== "string") {
        setError("Invalid service ID");
        setLoading(false);
        toast.error("Invalid service ID");
        return;
      }

      try {
        const response = await api.get(`/services/${id}`);
        const service: Service = response.data.data;
        

        // Map service to provider
        const mappedProvider: Provider = {
          id: service.id,
          image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
          name: `${service.provider.firstName} ${service.provider.lastName}`,
          title: service.title,
          experience: service.description || "No experience provided",
          languages: "English, Kinyarwanda, Swahili, French",
          location: "Nyamirambo, Kigali",
          price: `${service.price} RWF/day`,
          rating: 4.8,
          reviews: 8289,
          distance: "2 miles",
          available: true,
          verified: true,
          type: service.provider.userType === "AGENCY" ? "AGENCY" : "INDIVIDUAL",
        };

        setProvider(mappedProvider);
        setError(null);
      } catch (err) {
        const message = (err as Error).message || "Failed to fetch service details";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleSlotConfirm = (selectedDate: string, selectedTime: string) => {
    console.log("Selected Slot:", { date: selectedDate, time: selectedTime });
    // Additional logic can be handled in SlotSelectionDialog
  };

  // Handle copy link for Share button
  const handleShare = () => {
    const shareLink = window.location.href;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  // Render error state
  if (error || !provider) {
    return (
      <div className="p-6">
        <BackButtonHeader text="Service Details" backHref="/" />
        <div className="text-center text-red-500 py-4">
          {error || "Service not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <BackButtonHeader text="Service Details" backHref="/" />

      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: "50vh" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100vh" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#FFFFFF80]/50 rounded-[32px] p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-[78px] h-[78px]">
                  <AvatarImage src={provider.image} />
                  <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <h2 className="text-lg font-semibold text-[#1B2431]">
                    {provider.name}
                  </h2>
                  <p className="text-sm text-[#212121] font-bold">
                    {provider.title}
                  </p>
                </div>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(provider.id);
                }}
                className={`cursor-pointer ${isLoading ? "opacity-50" : ""}`}
              >
                <Icons.BookMarkIcon
                  className={`w-6 h-6 ${isBookmarked(provider.id)
                      ? "fill-[#145B10] stroke-white"
                      : "stroke-[#145B10] hover:stroke-green-600"
                    }`}
                />
              </span>
            </div>

            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" /> {provider.experience}
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Languages className="w-4 h-4 text-[#212121]" /> {provider.languages}
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <MapPin className="w-4 h-4 text-[#212121]" /> {provider.location}
              </p>
              <p className="flex flex-col gap-3 text-[#616161] font-semibold leading-[120%] text-sm">
                <strong className="font-bold text-[#212121] text-lg leading-[100%]">
                  Description
                </strong>
                {provider.experience || "No description available."}
              </p>
            </div>

            <div className="flex gap-5 py-4 justify-center">
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <Phone className="w-5 h-5" />
                </span>
                Call
              </div>
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <MessageCircleMore className="w-5 h-5" />
                </span>
                Message
              </div>
              <div
                className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white cursor-pointer"
                onClick={handleShare}
              >
                <span className="px-6 pt-4">
                  <Share className="w-5 h-5" />
                </span>
                Share
              </div>
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <MapPin className="w-5 h-5" />
                </span>
                Map
              </div>
            </div>

            <ReviewSection serviceId={id} />

            <div className="py-2 flex items-center justify-between">
              <h1 className="text-[#145B10] font-bold text-lg leading-[120%]">{provider.price}</h1>
              <SlotSelectionDialog
                trigger={
                  <Button className="rounded-[100px] font-bold mr-3 bg-[#145B10] text-white hover:bg-[#145B10]/90">
                    Select Slot
                  </Button>
                }
                providerName={provider.name}
                price={provider.price}
                onConfirm={handleSlotConfirm}
                availableDates={availableDates}
                availableTimes={availableTimes}
                provider={provider}
              />
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <ServiceProvider showHeader={true} />
        </div>
      </main>
    </div>
  );
};

export default Page;