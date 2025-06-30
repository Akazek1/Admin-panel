"use client";
import { Icons } from "@/components/icons";
import { RootState } from "@/store";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";

const Header = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Function to determine greeting based on current time
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 12) {
      return "Good Morning 👋";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "Good Afternoon 👋";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "Good Evening 👋";
    } else {
      return "Good Night 👋";
    }
  };

  return (
    <div className="flex justify-between items-center rounded">
      {user?.userType === "Individual" ? (
        <Link href={"/profile"} className="flex items-center gap-2">
          {user?.profilePicture ? (
            <div>
              <Image
                src={user?.profilePicture || "/default-profile.png"}
                alt="Profile Picture"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover mr-2"
              />
            </div>
          ) : (
            <div className="p-2 cursor-pointer rounded-full bg-[#167021] text-white">
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="flex flex-col leading-3">
            <span className="text-[#757575] font-normal text-sm">{getGreeting()}</span>
            <span className="font-bold text-lg">
              {user?.firstName || user?.phoneNumber} {user?.lastName}
            </span>
          </div>
        </Link>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="bg-[#D0DECF] p-2">
              <Icons.Location className="w-5 h-5 text-green-600" />
            </span>
            <div>
              <p className="text-sm text-gray-500">Home</p>
              <p className="text-sm font-semibold">Jl. Soekarno Hatta 15A Malang</p>
            </div>
          </div>
        </>
      )}
      <div className="flex items-center gap-6">
        <Icons.Language className="w-6 h-6 text-gray-500" />
        <span className="relative">
          <Icons.BellIcon className="w-5 h-5 text-green-600 z-0" />
          <span className="bg-red-700 rounded-full w-1.5 h-1.5 absolute -top-0.5 right-1 z-10" />
        </span>
      </div>
    </div>
  );
};

export default Header;