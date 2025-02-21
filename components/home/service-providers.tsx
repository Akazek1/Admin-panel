import React from "react";
import SectionHeader from "../section-header";
import ServiceCard from "../service-card";

const providers = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

const ServiceProvider = () => {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <SectionHeader
        title="Browse by Service Provider"
        linkText="See All"
        linkHref="/"
        className="text-[#1B2431] font-medium text-lg "
      />

      {/* Service Provider Cards */}
      <div className="space-y-4">
        {providers.map((provider, index) => (
          <ServiceCard key={index} {...provider} />
        ))}
      </div>
    </div>
  );
};

export default ServiceProvider;
