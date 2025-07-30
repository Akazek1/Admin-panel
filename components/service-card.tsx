"use client";
import { Star, MapPin, Languages, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { Icons } from "./icons";
import { useBookmark } from "@/context/bookmark-context";

interface ServiceCardProps {
  id: string;
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
  onClick: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  image,
  name,
  title,
  // experience,
  languages,
  location,
  price,
  rating,
  reviews,
  // distance,
  available,
  verified,
  onClick,
}) => {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmark("services");

  return (
    <div
      onClick={onClick}
      className="bg-white shadow-[#04060F0D] rounded-2xl p-5 flex items-center gap-4 cursor-pointer"
    >
      {/* Image */}
      <div className="relative">
        <Image
          src={image}
          alt={title || "Service Provider"}
          width={200}
          height={200}
          loading="lazy"
          className="max-w-[120px] h-44 object-cover rounded-t-[20px] rounded-br-[20px]"
        />
        <span
          className={`absolute bottom-0 left-0 text-xs font-medium px-2 py-1 rounded-tr-[20px] ${available ? "bg-[#FFFFFF] text-green-700" : "bg-[#FFFFFF] text-red-700"
            }`}
        >
          {available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 w-full overflow-hidden">
        {/* Profile Section */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[13px] sm:text-sm font-medium text-gray-700 flex items-center gap-1">
              {name || "Unknown Provider"}
              {verified && (
                <BadgeCheck className="fill-blue-500 stroke-white w-5 h-5" />
              )}
            </span>
            <h3 className="text-base sm:text-lg font-bold leading-5 text-[#212121] capitalize">
              {title || "Untitled Service"}
            </h3>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(id);
            }}
            className={`cursor-pointer ${isLoading ? "opacity-50" : ""}`}
          >
            <Icons.BookMarkIcon
              className={`w-6 h-6 ${isBookmarked(id)
                ? "fill-[#145B10] stroke-white"
                : "stroke-[#145B10] hover:stroke-green-600"
                }`}
            />
          </span>
        </div>

        {/* <p className="text-sm text-[#616161] font-medium flex  items-center gap-2 line-clamp-1">
          <Icons.BagIcon className="w-4 h-4 stroke-[#212121]" />
          {experience.length > 25 ? experience.slice(0, 22) + "..." : experience || "No experience provided"}
        </p> */}
        <p className="text-[13px] sm:text-sm text-[#616161] font-medium flex items-center gap-2 capitalize">
          <Languages className="w-5 h-5 text-[#212121]" />
          {languages || "No languages specified"}
        </p>
        <p className="text-[13px] sm:text-sm text-[#616161] font-medium flex items-center gap-2 capitalize">
          <MapPin className="w-4 h-4 text-[#212121]" />
          {location || "No location provided"}
        </p>
        <p className="text-[#145B10] font-semibold">{price || "Price not available"}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-[13px] sm:text-sm leading-[14px] text-[#616161] font-medium">
            <Star className="w-4 h-4 text-yellow-500" />
            {rating || "N/A"} |<span>{reviews || 0} reviews</span>
            {/* <span className="flex items-center gap-1">
              <Icons.ClockIcon className="w-3 h-3 stroke-[#212121]" /> {distance || "N/A"}
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;