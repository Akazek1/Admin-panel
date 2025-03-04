"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Star } from "lucide-react";
import { Inter } from "next/font/google";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const Feedback = () => {
  const [rating, setRating] = useState<number | null>(null); // Track the selected rating (1-5 or null)

  // Handle star click to set the rating
  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1); // Star index is 0-based, so add 1 for 1-5 rating
  };

  const handleSubmit = () => {
    toast.success("Thanks for your valuable feedback.");
  };

  return (
    <div className={`bg-[#F1FCEF] px-6 py-11 space-y-6 ${inter.className}`}>
      {/* Header */}
      <BackButtonHeader text="Share Feedback" />
      <div className="flex flex-col cursor-pointer gap-5">
        <h1 className="text-[#212121] text-xl font-medium leading-6 pr-6">
          How would you rate the app experience?
        </h1>
        <div className="flex items-center gap-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`w-7 h-7 stroke-1 ${
                rating && index < rating
                  ? "fill-[#F5C443] stroke-[#F5C443]"
                  : "stroke-[#9E9E9E]"
              }`}
              onClick={() => handleStarClick(index)}
            />
          ))}
        </div>
        <Textarea
          className="text-[#9E9E9E] placeholder:text-[#9E9E9E] leading-7 text-sm placeholder:text-sm placeholder:font-semibold font-semibold"
          placeholder="Type in your feedback"
          rows={6}
        />
        <Button
          onClick={handleSubmit}
          className="bg-[#167021] py-[18px] px-4 h-full rounded-[40px] hover:bg-[#167021]/90 font-bold text-base leading-6 font-urbanist"
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default Feedback;
