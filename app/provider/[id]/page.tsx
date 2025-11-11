"use client";

import BackButtonHeader from "@/components/header/back-button-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { Languages, MapPin, Phone, Share, BadgeCheck, MessageCircleMore } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import ServiceCard from "@/components/service-card";
import { Service } from "@/types";
import Link from "next/link";

interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  userType: string;
  phoneNumber?: string;
  languages?: string[];
}

const ProviderProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const username = params.id as string; // Now using username instead of ID
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderData = async () => {
      if (!username || typeof username !== "string") {
        setError("Invalid provider username");
        setLoading(false);
        toast.error("Invalid provider username");
        return;
      }

      try {
        // Fetch services by providerUsername to get provider info
        const response = await api.get(`/services?providerUsername=${username}`);
        const servicesData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data?.data || [];

        if (servicesData.length === 0) {
          // If no services found, try to get user info directly
          try {
            const userResponse = await api.get(`/users/username/${username}`);
            const userData = userResponse.data.data || userResponse.data;
            const providerInfo: Provider = {
              id: userData.id,
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              profilePicture: userData.profilePicture,
              userType: userData.userType,
              phoneNumber: userData.phoneNumber,
              languages: userData.languages || [],
            };
            setProvider(providerInfo);
            setServices([]);
            setError(null);
          } catch (userErr: any) {
            setError("Provider not found");
            toast.error("Provider not found");
          }
        } else {
          // Get provider info from first service
          const firstService = servicesData[0];
          const providerInfo: Provider = {
            id: firstService.provider.id,
            firstName: firstService.provider.firstName || "",
            lastName: firstService.provider.lastName || "",
            profilePicture: firstService.provider.profilePicture,
            userType: firstService.provider.userType,
            phoneNumber: firstService.provider.phoneNumber,
            languages: firstService.provider.languages || [],
          };

          setProvider(providerInfo);
          setServices(servicesData);
          setError(null);
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Failed to fetch provider details";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [username]);

  const handleShare = () => {
    const shareLink = window.location.href;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        toast.success("Provider link copied to clipboard!");
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
        <BackButtonHeader text="Provider Profile" backHref="/" />
        <div className="text-center text-red-500 py-4">
          {error || "Provider not found"}
        </div>
      </div>
    );
  }

  const providerName = `${provider.firstName} ${provider.lastName}`.trim() || "Service Provider";
  const isAgency = provider.userType === "AGENCY";

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <BackButtonHeader text="Provider Profile" backHref="/" />

      <main className="flex-1 overflow-y-auto">
        {/* Provider Info Card */}
        <div className="bg-[#FFFFFF80]/50 rounded-2xl md:rounded-[32px] p-4 md:p-5 mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
                  <AvatarImage 
                    src={provider.profilePicture || "/default-profile.png"} 
                    className="object-cover" 
                  />
                  <AvatarFallback className="bg-[#145B10] text-white text-xl font-bold">
                    {provider.firstName?.[0]?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <h2 className="text-lg md:text-xl font-semibold text-[#1B2431] flex items-center gap-2">
                    {providerName}
                    {isAgency && (
                      <BadgeCheck className="fill-blue-500 stroke-white w-5 h-5" />
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#616161] capitalize">
                    {isAgency ? "Agency" : "Individual Provider"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Share provider profile"
              >
                <Share className="w-5 h-5 text-[#145B10]" />
              </button>
            </div>

            {provider.languages && provider.languages.length > 0 && (
              <div className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Languages className="w-4 h-4 text-[#212121]" />
                <span>{provider.languages.join(", ")}</span>
              </div>
            )}

            {provider.phoneNumber && (
              <div className="flex items-center gap-4 pt-2">
                <a 
                  href={`tel:${provider.phoneNumber}`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#145B10] text-white rounded-lg hover:bg-[#145B10]/90 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Call</span>
                </a>
                <Link 
                  href="/conversations"
                  className="flex items-center gap-2 px-4 py-2 border-2 border-[#145B10] text-[#145B10] rounded-lg hover:bg-[#145B10]/10 transition-colors"
                >
                  <MessageCircleMore className="w-4 h-4" />
                  <span className="text-sm font-medium">Message</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Services Section */}
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-bold text-[#1B2431]">
            Services ({services.length})
          </h3>
          
          {services.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No services available
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const mappedProvider = {
                  id: service.id,
                  image: service.serviceImage || "/default-service.png",
                  name: providerName,
                  title: service.title,
                  experience: service.description || "No description provided",
                  languages: Array.isArray(service?.worker?.languages) 
                    ? service.worker.languages.join(", ") 
                    : provider.languages?.join(", ") || "No Languages Specified",
                  location: Array.isArray(service.serviceAreas) 
                    ? service.serviceAreas.join(", ") 
                    : service.serviceAreas || "No Location Specified",
                  price: `${service.price} RWF/day`,
                  rating: service?.reviews?.averageRating || 0,
                  reviews: service?.reviews?.totalReviews || 0,
                  distance: "N/A",
                  available: service.isActive,
                  verified: isAgency,
                  type: provider.userType,
                };

                return (
                  <ServiceCard
                    key={service.id}
                    onClick={() => {
                      router.push(`/book/${provider.userType}/${service.id}`);
                    }}
                    {...mappedProvider}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderProfilePage;

