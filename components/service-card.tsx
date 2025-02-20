import { Star, MapPin, Bookmark, CheckCircle } from "lucide-react";
import Image from "next/image";

interface ServiceCardProps {
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
  return (
    <div className="bg-white shadow-[#04060F0D] rounded-2xl py-6 flex items-center gap-4">
      {/* Image */}
      <div className="relative">
        <Image
          src={image}
          alt={title}
          width={120}
          height={80}
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
      <div className="flex flex-col gap-1">
        {/* Profile Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">{name}</span>
            {verified && <CheckCircle className="text-blue-500 w-4 h-4" />}
          </div>
          <Bookmark className="text-gray-400 w-5 h-5 cursor-pointer hover:text-green-500" />
        </div>
        <h3 className="text-lg font-bold leading-5">{title}</h3>
        <p className="text-sm text-[#616161] font-medium">{experience}</p>
        <p className="text-sm text-[#616161] font-medium">{languages}</p>
        <p className="text-sm text-[#616161] font-medium">{location}</p>
        <div className="flex justify-between items-center">
          <p className="text-green-600 font-semibold">{price}</p>
          <div className="flex items-center gap-1 text-sm text-[#616161] font-medium">
            <Star className="w-4 h-4 text-yellow-500" />
            {rating} | {reviews} reviews
            <MapPin className="w-4 h-4 text-gray-400" /> {distance}
          </div>
        </div>
      </div>

      {/* Pricing & Ratings */}
    </div>
  );
};

export default ServiceCard;
