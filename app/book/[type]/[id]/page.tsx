// pages/book/[type]/[id].tsx
"use client";
import BackButtonHeader from "@/components/header/back-button-header";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, MapPin, MessageCircleMore, Phone, Share, Star } from "lucide-react";
import ServiceProvider from "@/components/home/service-providers";
import { motion } from "framer-motion";
import SlotSelectionDialog from "@/components/slot-selection-dialog";

// Define the provider interface
interface Provider {
  id: number;
  image: string;
  name: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  distance: string;
  available: boolean;
  verified: boolean;
  type: string;
}

const providers: Provider = {
  id: 1,
  image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
  name: "Akaliza Mukumbu",
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
  type: "Professional",
};

// Sample review data
const reviews = [
  {
    name: "Morgane Fike",
    rating: 5,
    comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam commodo vehicula quam a imperdiet. Morbi semper eros nec arcu fermentum vehicula. Aliquam venenatis erat quis pharetra facilisis.",
  },
  {
    name: "Morgane Fike",
    rating: 5,
    comment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam commodo vehicula quam a imperdiet. Morbi semper eros nec arcu fermentum vehicula. Aliquam venenatis erat quis pharetra facilisis.",
  },
];

// Sample date and time data
const availableDates = [
  { day: "Tue", date: 18 },
  { day: "Wed", date: 19 },
  { day: "Thu", date: 20 },
  { day: "Fri", date: 21 },
];

const availableTimes = ["10:00am", "10:00am", "10:00am", "10:00am", "10:00am", "10:00am", "10:00am"];

const Page = () => {
  const [bookMark, setBookMark] = useState<number[]>([]);

  const handleBookMark = (id: number) => {
    setBookMark(
      (prevBookmarked) =>
        prevBookmarked.includes(id)
          ? prevBookmarked.filter((itemId) => itemId !== id)
          : [...prevBookmarked, id]
    );
  };

  const handleSlotConfirm = (selectedDate: string, selectedTime: string) => {
    console.log("Selected Slot:", { date: selectedDate, time: selectedTime });
    // Navigation is handled in SlotSelectionDialog, but you can add additional logic here if needed
  };

  return (
    <div className="p-6 space-y-6">
      <BackButtonHeader text="Service Details" backHref="/" />

      <main className="flex-1  overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: "50vh" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100vh" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-[#FFFFFF80]/50 rounded-[32px] p-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-[78px] h-[78px]">
                  <AvatarImage src={providers.image} />
                  <AvatarFallback>{providers.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <h2 className="text-lg font-semibold text-[#1B2431]">
                    {providers.name}
                  </h2>
                  <p className="text-sm text-[#212121] font-bold">
                    {providers.title}
                  </p>
                </div>
              </div>
              <span onClick={() => handleBookMark(providers.id)}>
                <Icons.BookMarkIcon
                  className={`w-6 h-6 cursor-pointer ${bookMark.includes(providers.id)
                    ? "fill-[#145B10] stroke-white"
                    : "stroke-[#145B10] hover:stroke-green-600"
                    }`}
                />
              </span>
            </div>

            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" /> {providers.experience}
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <Languages className="w-4 h-4 text-[#212121]" /> {providers.languages}
              </p>
              <p className="flex items-center gap-2 text-[#616161] text-sm font-medium">
                <MapPin className="w-4 h-4 text-[#212121]" /> {providers.location}
              </p>
              <p className="flex flex-col gap-3 text-[#616161] font-semibold leading-[120%] text-sm">
                <strong className="font-bold text-[#212121] text-lg leading-[100%]">
                  Description
                </strong>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam commodo vehicula quam a facilisis. Aliquam venenatis et quis pharetra facilisis.
              </p>
            </div>

            <div className="flex gap-5 py-4 justify-center">
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <Phone className="w-5 h-5" />
                </span>
                Call
              </div>
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <MessageCircleMore className="w-5 h-5" />
                </span>
                Message
              </div>
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <Share className="w-5 h-5" />
                </span>
                Share
              </div>
              <div className="flex flex-col items-center gap-1 pb-2 text-xs font-medium bg-white text-[#145B10] border-[#145B10] rounded-[10px] border-2 hover:bg-[#145B10] hover:text-white">
                <span className="px-6 pt-4">
                  <MapPin className="w-5 h-5" />
                </span>
                Map
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#FB9400] stroke-[#FB9400]" /> {providers.rating} | {providers.reviews} reviews • {providers.distance}
              </p>
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <div key={index} className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`https://i.pravatar.cc/150?img=${index + 1}`} />
                        <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center flex-col gap-1">
                          <p className="font-semibold text-sm">{review.name}</p>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? "fill-[#FB9400] stroke-[#FB9400]" : "fill-none stroke-[#FB9400]"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] leading-[120%] text-[#616161] font-semibold">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-2 flex items-center justify-between">
              <h1 className="text-[#145B10] font-bold text-lg leading-[120%]">300 RWF/Hr</h1>
              <SlotSelectionDialog
                trigger={
                  <Button className="rounded-[100px] font-bold mr-3 bg-[#145B10] text-white hover:bg-[#145B10]/90">
                    Select Slot
                  </Button>
                }
                providerName={providers.name}
                price="300 RWF/Hr"
                onConfirm={handleSlotConfirm}
                availableDates={availableDates}
                availableTimes={availableTimes}
                provider={providers} // Pass the provider object
              />
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <ServiceProvider showHeader={true} />
        </div>
      </main>
    </div>
  );
};

export default Page;