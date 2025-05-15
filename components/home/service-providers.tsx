// ServiceProvider.tsx
"use client";
import React, { useState } from "react";
import SectionHeader from "../section-header";
import ServiceCard from "../service-card";
import Scroller from "../scroller";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

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

const providers: Provider[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Akaliza",
    title: "Baby Sitter",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: true,
    verified: true,
    type: "Professional"
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "HouseHelp",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: false,
    verified: false,
    type: "Agency"
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "HouseHelp",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: true,
    verified: true,
    type: "Agency"
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "Repairing",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: false,
    verified: false,
    type: "Professional"
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "Painting",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: true,
    verified: true,
    type: "Agency"
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "Repairing",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: false,
    verified: false,
    type: "Professional"
  },
  {
    id: 7,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    name: "Agency",
    title: "Cleaning",
    experience: "5 Years of Experience",
    languages: "English, Kinyarwanda, Swahili, French",
    location: "Nyamirambo, Kigali",
    price: "3000-5000 rwf/day",
    rating: 4.8,
    reviews: 8289,
    distance: "2 miles",
    available: true,
    verified: true,
    type: "Agency"
  },
];


const filters = ["All", "Cleaning", "Repairing", "Painting"];


interface ServiceProviderProps {
  showHeader: boolean;
}

const ServiceProvider: React.FC<ServiceProviderProps> = ({ showHeader }) => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("All");

  const filteredProviders = providers.filter((provider) => {
    if (selectedFilter === "All") return true;
    return provider.title === selectedFilter;
  });

  return (
    <div >
      {showHeader && (
        <SectionHeader
          title="Browse by Service Provider"
          linkText="See All"
          linkHref="/"
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
                  transition-all duration-300 ease-in-out
                  ${selectedFilter === filter
                    ? "bg-[#145B10] text-white scale-105"
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
        <motion.div
          key={selectedFilter || "default"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="flex flex-col gap-4 pb-8"
        >
          {filteredProviders.length > 0 ? (
            filteredProviders.map((provider) => (
              <ServiceCard
                key={provider.id}
                onClick={() => router.push(`/book/${provider.type}/${provider.id}`)}
                {...provider}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">
              No providers found for this filter
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServiceProvider;



