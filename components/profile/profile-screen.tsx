"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleEllipsis,
  Verified,
  MessageSquare,
  Camera,
} from "lucide-react";
import { Icons } from "../icons";
import { Separator } from "../ui/separator";
import { Avatar, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import { logout } from "@/store/slices/auth-slice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter } from "next/navigation";
import { updateUser } from "@/store/slices/auth-slice";
import api from "@/lib/axios";

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Menu items with Lucide icon components
  const menuItems = [
    { name: "Edit Profile", Icon: Icons.UserIcon, href: "/profile/edit" },
    {
      name: "Transactions",
      Icon: Icons.WalletIcon,
      href: "/profile/transactions",
    },
    {
      name: "Order History",
      Icon: Icons.OrderHistoryIcon,
      href: "/profile/orders",
    },
    {
      name: "Address Book",
      Icon: Icons.BookIcon,
      href: "/profile/address-book",
    },
    {
      name: "Privacy Policy",
      Icon: Icons.LockIcon,
      href: "/profile/privacy-policy",
    },
    { name: "Share Feedback", Icon: MessageSquare, href: "/profile/feedback" },
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/onboarding");
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return; // Guard against no file or no user

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.patch("/users/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update user in Redux store with new profile URL
      if (response.data.user && response.data.user.profileURL) {
        dispatch(updateUser({
          id: user.id,
          phoneNumber: user.phoneNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          isProfileComplete: user.isProfileComplete,
          isMobileVerified: user.isMobileVerified,
          isEmailVerified: user.isEmailVerified,
          profileURL: response.data.user.profileURL,
        }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err as { response?: { data?: { message?: string } } }).response?.data?.message) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "An error occurred");
      } else {
        setError("Failed to update profile image");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated || !user) {
    router.push("/onboarding");
    return null;
  }

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#F1FCEF]">
        <h1 className="text-2xl leading-[120%] text-[#212121] font-bold flex items-center gap-4">
          <Image src={"/images/hwa-green-icon.png"} width={20} height={20} alt="icon" />
          More
        </h1>
        <Link href="/settings" className=" p-1 rounded-full">
          <CircleEllipsis className="w-[21px] h-[21px] text-black" />
        </Link>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col justify-center items-center gap-4 relative">
        <label htmlFor="profile-image" className="relative cursor-pointer group">
          <Avatar className={`w-[120px] h-[120px] ${isUploading ? "animate-pulse" : ""}`}>
            <AvatarImage
              src={user.profileURL || "/images/user.png"}
              className="object-cover"
            />
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <input
            id="profile-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isUploading}
          />
        </label>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-semibold text-[#1B2431]">
              {user.firstName} {user.lastName}
            </h2>
            {user.isProfileComplete && (
              <Verified className="w-5 h-5 fill-[#145B10] stroke-white" />
            )}
          </div>
          <p className="text-sm text-center text-[#212121] font-bold">{user.email || user.phoneNumber}</p>
        </div>
      </div>

      <Separator className="bg-[#EEEEEE]" />

      {/* Menu Items */}
      <div className="space-y-5">
        {menuItems.map((item) => {
          const IconComponent = item.Icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center justify-between rounded-lg transition-colors"
            >
              <div className="flex items-center gap-5">
                <IconComponent className="w-6 h-6 text-[#212121]" />
                <span className="text-lg text-[#1B2431] leading-6 ">
                  {item.name}
                </span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          );
        })}
        {/* Logout Button */}
        <div
          className="w-max p-0 leading-6 text-xl font-medium text-red-500 transition-colors flex items-center gap-5 cursor-pointer"
          onClick={handleLogout}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.4228 14.141H11.375" stroke="#F75555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22.0083 10.7383L25.4243 14.1403L22.0083 17.5423" stroke="#F75555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19.0864 8.90134C18.7014 4.72467 17.1381 3.20801 10.9198 3.20801C2.63526 3.20801 2.63526 5.90301 2.63526 13.9997C2.63526 22.0963 2.63526 24.7913 10.9198 24.7913C17.1381 24.7913 18.7014 23.2747 19.0864 19.098" stroke="#F75555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Logout
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;