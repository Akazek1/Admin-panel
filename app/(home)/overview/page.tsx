import Header from "@/components/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import ServiceProvider from "@/components/home/service-providers";
import PopulerService from "@/components/home/service-scroller";
import SearchBar from "@/components/search";
import React from "react";

const page = () => {
  return (
    <div className="p-6 space-y-6">
      <Header />
      <SearchBar />
      <PromoBanner />
      <Categories />
      <PopulerService />
      <ServiceProvider />
    </div>
  );
};

export default page;
