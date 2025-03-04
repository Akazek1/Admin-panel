"use client";
import React, { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button"; // Assuming you're using shadcn/ui
import { ArrowLeft } from "lucide-react";
import Scroller from "../scroller";
import Image from "next/image";

interface SearchResultsProps {
  query: string;
  onBack: () => void;
}

const SearchResults = ({ query: initialQuery, onBack }: SearchResultsProps) => {
  const [query, setQuery] = useState(initialQuery); // Local state for the search query

  // Optional: Debounce the query updates to notify the parent if needed
  useEffect(() => {
    const timer = setTimeout(() => {
      // You can call a parent callback here if you want to update the search in HomeContent
      // For now, we’ll just keep it local to avoid closing
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Sample data (hard-coded as per your request to ignore data fetching)
  const popularSearches = [
    "Indoor Cleaning",
    "Plumbing Drain Repair",
    "Electrical Help",
    "Interior Painting",
    "Packing and unpacking",
    "Home Repairs",
    "Laundry Service",
  ];

  const categories = [
    {
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      title: "Plumbing",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      title: "Carpentry",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      title: "Painting",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      title: "Cleaning",
    },
    {
      image:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      title: "Electric Help",
    },
  ];

  return (
    <div className="space-y-6 ">
      {/* Header with Back Arrow */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="p-2">
          <ArrowLeft className="w-8 h-8" />
        </Button>
        <h1 className="text-lg font-semibold text-[#1B2431]">HouseHelp</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
        <input
          type="text"
          placeholder={`Search within HouseHelp`}
          className="w-full pl-10 border-[#878787] border rounded-[40px] placeholder:text-xs placeholder:text-[#878787] py-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)} // Update local query on change
        />
        <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
      </div>

      {/* Popular Searches */}
      <div className="space-y-2">
        <h2 className="text-lg leading-5 font-bold text-[#1B2431]">
          Popular Searches
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          {popularSearches.map((search, index) => (
            <button
              key={index}
              className="flex items-center py-2 px-3 rounded-[50px] border border-[#E5E5E5] text-sm text-[#1B2431] hover:text-[#145B10] hover:border-[#145B10]"
              onClick={() => {
                setQuery(search); // Update query with selected search
                // Optionally, you can call onSearch here to notify the parent if needed
              }}
            >
              {search} <ArrowLeft className="w-5 h-5 rotate-[145deg]" />
            </button>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div className="space-y-4">
        <h2 className="text-lg leading-5 font-bold text-[#1B2431]">
          Top services on HouseHelp
        </h2>
        <div className="flex items-center gap-3 ">
          <Scroller
            items={categories}
            visibleItems={5.3}
            renderItem={(item) => (
              <div className="rounded-lg  px-2 overflow-hidden flex flex-col items-center justify-center gap-1 w-full">
                <div>
                  <Image
                    height={500}
                    width={500}
                    src={item.image}
                    alt={item.title}
                    className="w-14 h-14 rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="w-full text-center ">
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    {item.title}
                  </h3>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
