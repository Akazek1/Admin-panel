"use client";
import React, { useState } from "react";
import Header from "@/components/header/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import ServiceProvider from "@/components/home/service-providers";
import PopulerService from "@/components/home/service-scroller";
import { motion, AnimatePresence } from "framer-motion";
import SearchResults from "@/components/search/search-result";
import SearchBar from "@/components/search/search";

const HomeContent = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query); // Update the query, even if empty
    setIsSearching(true); // Show search results immediately on focus
  };

  const handleBack = () => {
    setIsSearching(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 p-6">
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="search-results"
            initial={{ opacity: 0, y: 20 }} // Slide in from below
            animate={{ opacity: 1, y: 0 }} // Slide to final position
            exit={{ opacity: 0, y: -20 }} // Slide out upward
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SearchResults query={searchQuery} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div
            key="home-content"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="space-y-6">
              <Header />
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search baby sitter, carpenter etc"
              />
              <PromoBanner />
              <Categories />
              <PopulerService />
              <ServiceProvider />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeContent;
