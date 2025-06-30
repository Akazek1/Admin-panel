"use client";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import Header from "@/components/header/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import PopulerService from "@/components/home/service-scroller";
import SearchResults from "@/components/search/search-result";
import SearchBar from "@/components/search/search";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const ServiceProvider = dynamic(() => import("@/components/home/service-providers"), {
  ssr: false,
});

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
    <div className="space-y-6 p-6 relative">
      {isSearching ? (
        <SearchResults query={searchQuery} onBack={handleBack} />
      ) : (

        <div className="space-y-6">
          {
            user?.userType === "Individual"
            &&
            <>
              <Header />
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search baby sitter, carpenter etc"
              />
              <PromoBanner />
              <Categories />
              <PopulerService />
            </>
          }
          <ServiceProvider showHeader={true} />
        </div>
      )}
    </div>
  );
};

export default HomeContent;
