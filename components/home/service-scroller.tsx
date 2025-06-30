"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Scroller from "../scroller";
import { Heart, Loader2 } from "lucide-react";
import SectionHeader from "../section-header";
import { Icons } from "../icons";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

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
    userType: string;
    profileImg: string;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DisplayService {
  id: string;
  image: string;
  title: string;
  type?: "service"; // Optional type to differentiate service cards
}

const PopulerService = () => {
  const [scrollItems, setScrollItems] = useState<DisplayService[]>([]);
  const [liked, setLiked] = useState<DisplayService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCardClick = (service: DisplayService) => {
    router.push(`/service/?category=${encodeURIComponent(service.title)}`);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/services`);
      if (response.status !== 200) {
        throw new Error("Failed to fetch services");
      }
      const data: Service[] = await response.data.data;

      // Map services to the display format
      const mappedServices: DisplayService[] = data.map((service) => ({
        id: service.id,
        image: service.provider.profileImg || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
        title: service.title,
        type: "service",
      }));

      // No need to group by category or add headers; just use the flat list of services
      setScrollItems(mappedServices);
    } catch {
      setError("Something went wrong while fetching services.");
      setScrollItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (service: DisplayService) => {
    setLiked((prevLiked) =>
      prevLiked.some((item) => item.id === service.id)
        ? prevLiked.filter((item) => item.id !== service.id)
        : [...prevLiked, service]
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Popular Services"
        linkHref="/service?category=all"
        linkText="View all"
        linkClassName="text-[12px] flex items-center gap-2"
        icon={<Icons.NextIcon className="w-3 h-3 fill-[#1B2431]" />}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-500">{error}</div>
      )}

      {/* Services List */}
      {!isLoading && !error && scrollItems.length > 0 && (
        <div className="flex items-center">
          <Scroller
            items={scrollItems}
            visibleItems={2}
            renderItem={(service: DisplayService) => (
              <div
                onClick={() => handleCardClick(service)}
                className="flex flex-col gap-2 cursor-pointer"
              >
                <div className="relative rounded-lg overflow-hidden h-32 max-w-[208px] flex items-center justify-center">
                  <div className="absolute top-3 right-3">
                    <div
                      className="w-[22px] h-[22px] rounded-full bg-white cursor-pointer flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(service);
                      }}
                    >
                      <Heart
                        className="w-4 h-3"
                        fill={
                          liked.some((likedItem) => likedItem.id === service.id)
                            ? "#1B2431"
                            : "none"
                        }
                        stroke="#1B2431"
                      />
                    </div>
                  </div>
                  <Image
                    height={500}
                    width={500}
                    src={service.image}
                    alt={service.title}
                    className="min-w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-gray-800 capitalize">
                    {service.title}
                  </h3>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && scrollItems.length === 0 && (
        <div className="text-center text-[#878787]">
          No popular services found.
        </div>
      )}
    </div>
  );
};

export default PopulerService;