"use client";
import React, { useState, useEffect } from "react";
import SectionHeader from "../section-header";
import ServiceCard from "../service-card";
import Scroller from "../scroller";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Provider, Service } from "@/types";

interface ServiceProviderProps {
  showHeader: boolean;
}

const ServiceProvider: React.FC<ServiceProviderProps> = ({ showHeader }) => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive unique filters from service titles
  const filters = ["All", ...new Set(services.map((service) => service.title))];

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/services");
        const data = Array.isArray(response.data.data) ? response.data.data : [];

        // Validate services have valid id
        const validatedServices = data.filter(
          (service: Service) =>
            service.id && typeof service.id === "string" && service.id.trim() !== ""
        );
        setServices(validatedServices);
        setError(null);
      } catch (err) {
        const message = (err as Error).message || "Failed to fetch services";
        setError(message);
        toast.error(message);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Map services to Provider interface
  const filteredProviders: Provider[] = services
    .filter((service) => {
      if (selectedFilter === "All") return true;
      return service.title === selectedFilter;
    })
    .map((service) => ({
      id: service.id,
      image: service.serviceImage,
      name: `${service.provider.firstName} ${service.provider.lastName}`,
      title: service.title,
      experience: service.description || "No description provided",
      languages: Array.isArray(service?.worker?.languages) && service.worker.languages.join(", ") || "",
      location: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.serviceAreas || "",
      price: `${service.price} RWF/day`,
      rating: service?.reviews?.averageRating || 0,
      reviews: service?.reviews?.totalReviews || 0,
      distance: "2 miles",
      available: true,
      verified: true,
      type: service.provider.userType === "AGENCY" ? "AGENCY" : "INDIVIDUAL",
    }));

  return (
    <div>
      {showHeader && (
        <SectionHeader
          title="Browse by Service Provider"
          linkText="See All"
          linkHref="/services"
          className="text-[#1B2431] font-medium text-lg"
        />
      )}
      <div className="sticky top-0 z-10 bg-[#F1FCEF] py-4">
        <div className="flex rounded-lg">
          <Scroller
            visibleItems={3.5}
            gap={12}
            items={filters}
            renderItem={(filter) => (
              <button
                key={filter}
                className={`px-5 py-2 rounded-full border-2 border-[#145B10] text-[#145B10] font-semibold
                  transition-all duration-200 ease-in-out capitalize
                  ${selectedFilter === filter
                    ? "bg-[#145B10] text-white"
                    : "bg-transparent hover:bg-[#145B10]/10"
                  }`}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </button>
            )}
          />
        </div>
      </div>
      {/* Service Provider Cards */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-8"
          >
            <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-500 py-4"
          >
            {error}
          </motion.div>
        ) : (
          <motion.div
            key={selectedFilter || "default"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 pb-8"
          >
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <ServiceCard
                  key={provider.id}
                  onClick={() => {
                    if (!provider.id || provider.id === "NaN") {
                      toast.error("Invalid provider ID");
                      return;
                    }
                    router.push(`/book/${provider.type}/${provider.id}`);
                  }}
                  {...provider}
                />
              ))
            ) : (
              <p className="text-center text-gray-500">
                No providers found for this filter
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServiceProvider;