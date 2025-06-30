"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import ServiceCard from "@/components/service-card";
import { useRouter, useSearchParams } from "next/navigation";
import { Service } from "@/types";
import BackButtonHeader from "@/components/header/back-button-header";


const ServicePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get("category");
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (category) {
            fetchServices(category as string);
        }
    }, [category]);

    const fetchServices = async (category: string) => {
        setIsLoading(true);
        setError(null);
        try {
            let response;
            if (category === "all") {
                response = await api.get(`/services`);
            } else {
                response = await api.get(`/services?category=${encodeURIComponent(category.toLowerCase())}`);
            }
            if (response.status !== 200) {
                throw new Error("Failed to fetch services");
            }
            const data: Service[] = await response.data.data;
            console.log(data);
            
            setServices(data);
        } catch {
            setError("Something went wrong while fetching services.");
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="p-6 space-y-6">
            {/* Header with Back Arrow */}
            <BackButtonHeader text={category || "Services"} backHref="/" />

            {/* Loading State */}
            {isLoading && (
                <div className="text-center text-[#878787]">Loading services...</div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center text-red-500">{error}</div>
            )}

            {/* Services List */}
            {!isLoading && !error && services.length > 0 && (
                <div className="space-y-4">
                    <div className="grid gap-4">
                        {services.map((service) => (
                            <ServiceCard
                                key={service.id}
                                id={service.id}
                                image={service.serviceImage || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"}
                                name={`${service.provider.firstName} ${service.provider.lastName}`}
                                title={service.title}
                                experience="5+ years"
                                languages={Array.isArray(service.worker?.languages) ? service.worker.languages.join(", ") : ""}
                                location={Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.serviceAreas || ""}
                                price={`$${service.price}`}
                                rating={service.reviews.averageRating || 0}
                                reviews={service.reviews.totalReviews || 0}
                                distance="2.5 miles"
                                available={true}
                                verified={service.provider.userType === "AGENCY"} 
                                onClick={() => router.push(`/book/${service.provider.userType}/${service.id}`)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isLoading && !error && services.length === 0 && (
                <div className="text-center text-[#878787]">
                    No services found for this category.
                </div>
            )}
        </div>
    );
};

export default ServicePage;