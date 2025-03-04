"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ChevronRight,
  CircleEllipsis,
  LogOut,
  Verified,
  MessageSquare, // for Share Feedback
} from "lucide-react";
import { Icons } from "../icons";
import { Separator } from "../ui/separator";
import { Avatar, AvatarImage } from "../ui/avatar";

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
        <h1 className="text-lg font-semibold text-[#145B10]">More</h1>
        <Link href="/settings" className=" p-1 rounded-full">
          <CircleEllipsis className="w-5 h-5 text-black" />
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
        <Button
          variant="ghost"
          className="w-max p-0 leading-6 text-xl font-medium text-red-500 transition-colors flex items-center gap-5"
          onClick={handleLogout}
        >
          <LogOut className="w-7 h-7" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ProfileScreen;
