"use client";
import { Star, MapPin, Languages, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { Icons } from "./icons";
import { useState } from "react";

interface ServiceCardProps {
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
  verified?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  image,
  name,
  title,
  experience,
  languages,
  location,
  price,
  rating,
  reviews,
  distance,
  available,
  verified,
}) => {
  const [bookMark, setBookMark] = useState<number[]>([]); // Store bookmarked IDs

  const handleBookMark = (id: number) => {
    setBookMark(
      (prevBookmarked) =>
        prevBookmarked.includes(id)
          ? prevBookmarked.filter((itemId) => itemId !== id) // Remove if already bookmarked
          : [...prevBookmarked, id] // Add if not bookmarked
    );
  };

  return (
    <div className="bg-white shadow-[#04060F0D] rounded-2xl p-5 flex items-center gap-4 hover:scale-105 transition transform 2s ease-in cursor-pointer">
      {/* Image */}
      <div className="relative">
        <Image
          src={image}
          alt={title}
          width={200}
          height={200}
          className="max-w-[120px] h-44 object-cover rounded-t-[20px] rounded-br-[20px]"
        />
        <span
          className={`absolute bottom-0 left-0 text-xs font-medium px-2 py-1  rounded-tr-[20px] ${
            available
              ? "bg-[#FFFFFF] text-green-700"
              : "bg-[#FFFFFF] text-red-700"
          }`}
        >
          {available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3">
        {/* Profile Section */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {name}{" "}
              {verified && (
                <BadgeCheck className="fill-blue-500 stroke-white w-5 h-5" />
              )}
            </span>
            <h3 className="text-lg font-bold leading-5 text-[#212121]">
              {title}
            </h3>
          </div>
          <span onClick={() => handleBookMark(id)}>
            <Icons.BookMarkIcon
              className={`w-6 h-6 cursor-pointer ${
                bookMark.includes(id)
                  ? "fill-[#145B10] stroke-white"
                  : "stroke-[#145B10] hover:stroke-green-600"
              }`}
            />
          </span>
        </div>

        <p className="text-sm text-[#616161] font-medium flex items-center gap-2">
          <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" />
          {experience}
        </p>
        <p className="text-sm text-[#616161] font-medium flex items-center gap-2">
          <Languages className="w-5 h-5 text-[#212121]" />
          {languages}
        </p>
        <p className="text-sm text-[#616161] font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#212121]" />
          {location}
        </p>
        <p className="text-[#145B10] font-semibold">{price}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-sm leading-[14px]  text-[#616161] font-medium">
            <Star className="w-4 h-4 text-yellow-500" />
            {rating} |<span>{reviews} reviews</span>
            <span className="flex items-center gap-1">
              <Icons.ClockIcon className="w-3 h-3 stroke-[#212121] " />{" "}
              {distance}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Ratings */}
    </div>
  );
};

export default ServiceCard;
