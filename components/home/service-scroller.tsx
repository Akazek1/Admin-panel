"use client";
import Image from "next/image";
import Scroller from "../scroller";
import { useState } from "react";
import { Heart } from "lucide-react";
import SectionHeader from "../section-header";
import { Icons } from "../icons";

const categories = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Plumbing",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Carpentry",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Painting",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Cleaning",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Electric Help",
  },
];

const PopulerService = () => {
  const [liked, setLiked] = useState<
    { id: number; image: string; title: string }[]
  >([]);

  const handleLike = (id: number) => {
    setLiked(
      (prevLiked) =>
        prevLiked.some((item) => item.id === id)
          ? prevLiked.filter((item) => item.id !== id) // Remove if already liked
          : [...prevLiked, categories.find((item) => item.id === id)!] // Add if not liked
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Popular Services"
        linkHref="/providers"
        linkText="View all"
        linkClassName="text-[12px] flex items-center gap-2"
        icon={<Icons.NextIcon className="w-3 h-3 fill-[#1B2431]" />}
      />
      <Scroller
        items={categories}
        visibleItems={2}
        renderItem={(item) => (
          <div className=" flex flex-col gap-2">
            <div className="relative rounded-lg overflow-hidden h-32 max-w-[208px] flex items-center justify-center">
              <div className="absolute top-3 right-3  ">
                <div
                  className="w-[22px] h-[22px] rounded-full bg-white  cursor-pointer flex items-center justify-center"
                  onClick={() => handleLike(item.id)}
                >
                  <Heart
                    className="w-4 h-3"
                    fill={
                      liked.some((likedItem) => likedItem.id === item.id)
                        ? "#1B2431"
                        : "none"
                    }
                    stroke={
                      liked.some((likedItem) => likedItem.id === item.id)
                        ? "#1B2431"
                        : "#1B2431"
                    }
                  />
                </div>
              </div>
              <Image
                height={500}
                width={500}
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="">
              <h3 className="text-[12px] font-semibold text-gray-800">
                {item.title}
              </h3>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PopulerService;
