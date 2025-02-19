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
    <div className="py-6 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[#1B2431] font-normal text-[18px]">
          Browse all categories
        </h1>
        <button className="text-[12px] text-[#1B2431] font-medium flex items-center gap-2 ">
          View all
          <Icons.NextIcon className="w-3 h-3 fill-[#1B2431]" />
        </button>
      </div>
      <Scroller
        items={categories}
        itemWidth={72}
        visibleItems={5.3}
        renderItem={(item) => (
          <div className="bg-white rounded-lg overflow-hidden flex flex-col items-center justify-center gap-1 w-full">
            <div>
              <Image
                height={500}
                width={500}
                src={item.image}
                alt={item.title}
                className="w-14 h-14 rounded-full object-cover"
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

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Card Example</h2>
        <Scroller
          items={[1, 2, 3, 4, 5]}
          itemWidth={240}
          visibleItems={4}
          renderItem={(item) => (
            <div className="bg-white rounded-lg p-6  h-32 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">
                Card {item}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}
