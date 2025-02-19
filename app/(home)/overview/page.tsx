import Header from "@/components/header";
import Categories from "@/components/home/category-scroller";
import PromoBanner from "@/components/home/promo-banner";
import SearchBar from "@/components/search";
import React from "react";

const page = () => {
  return (
    <div className="p-6 space-y-6">
      <Header />
      <SearchBar />
      <PromoBanner />
      <Categories />
    </div>
  );
};

export default page;
