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
import { Provider, Service } from "@/types";
import Link from "next/link";



const Page = () => {
  const router = useParams();
  const id = router.id as string;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [availability, setAvailabity] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isBookmarked, toggleBookmark, isLoading } = useBookmark("services");

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
        setAvailabity(service?.availability || [])

        const mappedProvider: Provider = {
          id: service.id,
          image: service.serviceImage,
          name: `${service.provider.firstName} ${service.provider.lastName}`,
          title: service.title,
          experience: service.description || "No experience provided",
          languages: Array.isArray(service?.worker?.languages) && service.worker.languages.join(", ") || "No Languages Specified",
          location: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.serviceAreas || "No Location Specified",
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
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="p-4 md:p-6">
        <BackButtonHeader text="Service Details" backHref="/" />
        <div className="text-center text-red-500 py-4">
          {error || "Service not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <BackButtonHeader text="Service Details" backHref="/" />

      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: "50vh" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100vh" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#FFFFFF80]/50 rounded-2xl md:rounded-[32px] p-4 md:p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-[78px] md:h-[78px]">
                  <AvatarImage src={provider.image} className="object-cover" />
                  <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <h2 className="text-base md:text-lg font-semibold text-[#1B2431] line-clamp-1">
                    {provider.name}
                  </h2>
                  <p className="text-xs sm:text-sm capitalize text-[#212121] font-bold line-clamp-1">
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

            <div className="space-y-2 md:space-y-3">
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" />
                <span className="line-clamp-1">{provider.experience}</span>
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Languages className="w-4 h-4 text-[#212121]" />
                <span className="line-clamp-1">{provider.languages}</span>
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium capitalize">
                <MapPin className="w-4 h-4 text-[#212121]" />
                <span className="line-clamp-1">{provider.location}</span>
              </p>
              <p className="flex flex-col gap-2 md:gap-3 text-[#616161] font-semibold leading-[120%] text-sm">
                <strong className="font-bold text-[#212121] text-base md:text-lg leading-[100%]">
                  Description
                </strong>
                {provider.experience || "No description available."}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-5 py-3 md:py-4">
              <a href={`tel:${provider.phoneNumber}`} className="w-full">
                <div className="flex flex-col items-center gap-1 pb-1 md:pb-2 text-[11px] sm:text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-lg md:rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                  <span className="px-2 sm:px-4 pt-2 sm:pt-3 md:pt-4">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  Call
                </div>
              </a>
              <Link href="/conversations" className="w-full">
                <div className="flex flex-col items-center gap-1 pb-1 md:pb-2 text-[11px] sm:text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-lg md:rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                  <span className="px-2 sm:px-4 pt-2 sm:pt-3 md:pt-4">
                    <MessageCircleMore className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  Message
                </div>
              </Link>
              <div
                className="flex flex-col items-center gap-1 pb-1 md:pb-2 text-[11px] sm:text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-lg md:rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white cursor-pointer"
                onClick={handleShare}
              >
                <span className="px-2 sm:px-4 pt-2 sm:pt-3 md:pt-4">
                  <Share className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                Share
              </div>
              <div className="flex flex-col items-center gap-1 pb-1 md:pb-2 text-[11px] sm:text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-lg md:rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-2 sm:px-4 pt-2 sm:pt-3 md:pt-4">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                Map
              </div>
            </div>

            <ReviewSection serviceId={id} />

            <div className="py-2 flex items-center justify-between">
              <h1 className="text-[#145B10] font-bold text-base md:text-lg leading-[120%]">
                {provider.price}
              </h1>
              <SlotSelectionDialog
                trigger={
                  <Button className="rounded-[100px] font-bold text-xs sm:text-sm bg-[#145B10] text-white hover:bg-[#145B10]/90 py-2 px-4 sm:py-2 sm:px-6">
                    Select Slot
                  </Button>
                }
                providerName={provider.name}
                price={provider.price}
                onConfirm={handleSlotConfirm}
                provider={provider}
                availability={availability} 
              />
            </div>
          </div>
        </motion.div>

        <div className="space-y-4 mt-6">
          <ServiceProvider showHeader={true} />
        </div>
      </main>
    </div>
  );
};

export default Page;