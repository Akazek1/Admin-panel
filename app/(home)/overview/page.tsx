"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import PopulerService from "@/components/home/service-scroller";
import SearchResults from "@/components/search/search-result";
import SearchBar from "@/components/search/search";
import ServiceProvider from "@/components/home/service-providers";
import RecievedBookings from "@/components/recieved-booking/recieved-booking";
import ViewModeToggle from "@/components/view-mode-toggle";
import TutorialModal from "@/components/tutorial-modal";
import { useViewMode } from "@/context/view-mode-context";


const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const { viewMode } = useViewMode();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if tutorial query parameter is present
    if (searchParams.get("tutorial") === "true") {
      setShowTutorial(true);
      // Remove the query parameter from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <>
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <div className="space-y-6 p-3 sm:p-6 relative">
        {isSearching ? (
          <SearchResults query={searchQuery} onBack={handleBack} />
        ) : (
          <div className="space-y-6">
            <Header />
            <div className="flex justify-center">
              <ViewModeToggle />
            </div>
            
            {viewMode === "employer" ? (
              // Employer view: Show service providers (who they can hire)
              <>
                <SearchBar
                  onSearch={handleSearch}
                  placeholder="Search baby sitter, carpenter etc"
                />
                <PromoBanner />
                <Categories />
                <PopulerService />
                <ServiceProvider showHeader={true} />
              </>
            ) : (
              // Provider view: Show received bookings/job postings (what they can work on)
              <RecievedBookings 
                title="Job Postings" 
                emptyMessage="No job postings available at the moment."
              />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HomeContent;
