"use client";

import React, { useState } from "react";
import Header from "@/components/header/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import PopulerService from "@/components/home/service-scroller";
import SearchResults from "@/components/search/search-result";
import SearchBar from "@/components/search/search";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import RecievedBookings from "@/components/recieved-booking/recieved-booking";

import ServiceProvider from "@/components/home/service-providers";


const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 p-3 sm:p-6 relative">
      {isSearching ? (
        <SearchResults query={searchQuery} onBack={handleBack} />
      ) : (

        <div className="space-y-6">
          <Header />
          {
            user?.userType === "Individual"
              ?
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
              :
              <RecievedBookings />
          }
        </div>
      )}
    </div>
  );
};

export default HomeContent;
