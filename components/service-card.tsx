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
  onRemoveBookmark?: () => void; // Optional prop for removing bookmark
  isBookmarked?: boolean; // Optional prop to override context bookmark state
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
  onRemoveBookmark,
  isBookmarked: isBookmarkedProp,
}) => {
  const { isBookmarked: isBookmarkedContext, toggleBookmark, isLoading } = useBookmark("services");
  
  const isServiceBookmarked = isBookmarkedProp !== undefined ? isBookmarkedProp : isBookmarkedContext(id);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation(); 

    
    if (isServiceBookmarked && onRemoveBookmark) {
      await onRemoveBookmark();
    } else {

      await toggleBookmark(id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-100 shadow-sm hover:shadow-lg rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
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
          className={`absolute bottom-0 left-0 text-xs font-semibold px-2.5 py-1 rounded-tr-[20px] shadow-sm ${
            available 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
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
            onClick={handleBookmarkClick}
            className={`cursor-pointer ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Icons.BookMarkIcon
              className={`w-6 h-6 ${isServiceBookmarked
                ? "fill-[#145B10] stroke-white"
                : "stroke-[#145B10] hover:stroke-green-600"
                }`}
            />
          </span>
        </div>

        {/* <p className="text-sm text-[#616161] font-medium flex items-center gap-2 line-clamp-1">
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
            <div className="relative w-4 h-4">
              {/* Background star (empty) */}
              <Star className="w-4 h-4 stroke-gray-400 fill-none absolute" />
              {/* Filled star with clip based on rating */}
              {rating > 0 && (
                <div 
                  className="absolute overflow-hidden" 
                  style={{ width: `${(rating / 5) * 100}%`, height: '100%' }}
                >
                  <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                </div>
              )}
            </div>
            {rating || "N/A"} | {reviews || 0} reviews
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