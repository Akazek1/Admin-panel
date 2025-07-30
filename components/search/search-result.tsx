"use client";
import React, { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Scroller from "../scroller";
import Image from "next/image";
import api from "@/lib/axios";
import { Avatar, AvatarImage } from "../ui/avatar";
import Link from "next/link";

// Define the service-to-image mapping
const serviceImageMap: { [key: string]: string } = {
  "Home Cleaning": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Mover & Packer": "https://images.unsplash.com/photo-1576864033231-3c2f5c6a5b5b?auto=format&fit=crop&q=80&w=800",
  "Plumbing": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
  "Carpentry": "https://images.unsplash.com/photo-1592d3c0a0e0f5b5a5c5b?auto=format&fit=crop&q=80&w=800",
  "Painting": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Cleaning": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Electric Help": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Electrician": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Baby Sitter": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "House Help": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Plumber": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
  "Carpenter": "https://images.unsplash.com/photo-1592d3c0a0e0f5b5a5c5b?auto=format&fit=crop&q=80&w=800",
  "Gardener": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Cook": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Driver": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Laundry Service": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Security Guard": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "AC Repair": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
  "Appliance Technician": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
};

// Reusable Popular Services Component
const PopularServices = ({ services, onServiceClick }: { services: string[], onServiceClick: (service: string) => void }) => {
  return (
    <div className="space-y-4">
        <h2 className="text-lg leading-5 font-bold text-[#1B2431]">
          Popular Services
        </h2>
      <div className="flex items-center gap-3">
        <Scroller
          items={services}
          visibleItems={5.3}
          renderItem={(service: string) => (
            <div
              className="rounded-lg px-2 overflow-hidden flex flex-col items-center justify-center gap-1 w-full cursor-pointer"
              onClick={() => onServiceClick(service)}
            >
              <div>
                <Image
                  height={500}
                  width={500}
                  src={serviceImageMap[service] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"}
                  alt={service}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="w-full text-center">
                <h3 className="text-[11px] font-semibold text-gray-800 max-w-[60px]">
                  {service}
                </h3>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
};

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  serviceImage?: string;
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

interface SearchResultsProps {
  query: string;
  onBack: () => void;
}

const SearchResults = ({ query: initialQuery, onBack }: SearchResultsProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search query to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        fetchServices(query);
      } else {
        setServices([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch services from API
  const fetchServices = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const normalizedQuery = searchQuery.toLowerCase();
      const response = await api.get(`/services?category=${encodeURIComponent(normalizedQuery)}`);

      if (response.status !== 200) {
        throw new Error("Failed to fetch services");
      }
      const data: Service[] = await response.data.data;

      setServices(data);
    } catch {
      setError("Something went wrong while fetching services.");
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for popular searches and categories
  const popularSearches = [
    "Electrician",
    "Baby Sitter",
    "Painter",
    "House Help",
    "Plumber",
    "Carpenter",
    "Gardener",
    "Cook",
    "Driver",
    "Laundry Service",
    "Security Guard",
    "AC Repair",
    "Appliance Technician",
    "Home Cleaning",
    "Mover & Packer",
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Header with Back Arrow */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="p-2">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-lg font-semibold text-[#1B2431]">Home Services</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
        <input
          type="text"
          placeholder={`Search within Home Services`}
          className="w-full pl-10 border-[#878787] border rounded-[40px] placeholder:text-sm placeholder:text-[#878787] py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-[#878787]">Loading services...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-500">{error}</div>
      )}

      {/* Search Results */}
      {!isLoading && !error && query.trim() && services.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B2431]">Search Results</h2>
          <div className="grid gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book/${service?.provider?.userType}/${service?.id}`}
                className="p-2 border bg-white border-[#E5E5E5] rounded-lg hover:border-[#145B10] transition-colors flex items-center gap-5"
              >
                <Avatar className={`w-[50px] h-[50px]`}>
                  <AvatarImage src={service?.serviceImage || "/images/user.png"} className="object-cover" />
                </Avatar>
                <div>
                  <div className="w-full flex items-center gap-2">
                    <h3 className="text-md font-semibold text-[#1B2431] capitalize">{service.title}</h3>
                    <p className="text-sm text-[#145B10] font-semibold">${service.price}</p>
                  </div>
                  <p className="text-sm text-[#878787]">{service.description}</p>
                  <p className="text-xs text-[#878787]">
                    Provided by: {service.provider.firstName} {service.provider.lastName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && query.trim() && services.length === 0 && (
        <div className="text-center text-[#878787]">
          No services found for &quot;{query}&quot;.
        </div>
      )}

      {/* Popular Searches (shown when no query or no results) */}
      {(!query.trim() || services.length === 0) && (
        <div className="space-y-2">
          <h2 className="text-lg leading-5 font-bold text-[#1B2431]">
            Popular Searches
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {popularSearches.map((search, index) => (
              <button
                key={index}
                className="flex items-center py-1 px-2 sm:py-2 sm:px-3 rounded-[50px] border border-[#E5E5E5] text-[13px] sm:text-sm text-[#1B2431] hover:text-[#145B10] hover:border-[#145B10]"
                onClick={() => setQuery(search)}
              >
                {search} <ArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 rotate-[145deg]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Services (shown when no query or no results) */}
      {(!query.trim() || services.length === 0) && (
        <PopularServices services={popularSearches} onServiceClick={setQuery} />
      )}
    </div>
  );
};

export default SearchResults;