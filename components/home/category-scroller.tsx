"use client";
import Image from "next/image";
import Scroller from "../scroller";
import { Icons } from "@/components/icons";

const categories = [
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Plumbing",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Carpentry",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Painting",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Cleaning",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    title: "Electric Help",
  },
];

export default function Categories() {
  return (
    <div className="pt-6 pb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[#1B2431] font-normal text-[18px]">
          Browse all categories
        </h1>
        <button className="text-[12px] text-[#1B2431] font-medium flex items-center gap-2 ">
          View all
          <Icons.NextIcon className="w-3 h-3 fill-[#1B2431]" />
        </button>
      </div>
      <div className="flex items-center gap-3 ">
        <Scroller
          items={categories}
          visibleItems={5.3}
          renderItem={(item) => (
            <div className="rounded-lg  px-2 overflow-hidden flex flex-col items-center justify-center gap-1 w-full">
              <div>
                <Image
                  height={500}
                  width={500}
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="w-full text-center ">
                <h3 className="text-[12px] font-semibold text-gray-800">
                  {item.title}
                </h3>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
