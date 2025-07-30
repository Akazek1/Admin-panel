"use client";

import React, { useState } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Star, Loader2 } from "lucide-react";
import { Inter } from "next/font/google";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const Feedback = () => {
  const [rating, setRating] = useState<number | null>(null); 
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); 

  // Handle star click to set the rating
  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1); 
  };

  // Handle textarea change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5 stars");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        message: message.trim() || undefined, 
      };

      await api.post("/feedback", payload);
      toast.success("Thanks for your valuable feedback!");
      setRating(null); 
      setMessage(""); 
    } catch (err) {
      console.error("Error submitting feedback:", err);
      const errorMessage =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any).response?.data?.message || "Failed to submit feedback";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-[#F1FCEF] p-6 pb-16 space-y-6 ${inter.className}`}>
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
              className={`w-7 h-7 stroke-1 ${rating && index < rating
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
          value={message}
          onChange={handleMessageChange}
        />
        <Button
          onClick={handleSubmit}
          className="bg-[#167021] py-[18px] px-4 h-full rounded-[40px] hover:bg-[#167021]/90 font-bold text-base leading-6 font-urbanist"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Feedback;