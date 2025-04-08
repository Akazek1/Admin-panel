"use client";
import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleEllipsis,
  Verified,
  MessageSquare, // for Share Feedback
} from "lucide-react";
import { Icons } from "../icons";
import { Separator } from "../ui/separator";
import { Avatar, AvatarImage } from "../ui/avatar";
import Image from "next/image";

const ProfileScreen = () => {
  const user = {
    name: "Gatete",
    email: "gatete@gmail.com",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  };

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

  const handleLogout = () => {
    console.log("Logged out");
  };

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
      <div className="flex flex-col justify-center items-center gap-4">
        <Avatar className="w-[120px] h-[120px]">
          <AvatarImage src={user.image} className="object-cover" />
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-semibold text-[#1B2431]">
              {user.name}
            </h2>
            <Verified className="w-5 h-5 fill-[#145B10] stroke-white" />
          </div>
          <p className="text-sm text-[#212121] font-bold">{user.email}</p>
        </div>
      </div>

      <Separator className="bg-[#EEEEEE]" />

      {/* Menu Items */}
      <div className="space-y-5">
        {menuItems.map((item) => {
          const IconComponent = item.Icon; // Lucide icon component
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
