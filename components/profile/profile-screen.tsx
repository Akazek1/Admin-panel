"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChevronRight,
  HelpingHand,
  MessageSquare,
  ShieldX,
} from "lucide-react";
import { Icons } from "../icons";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { logout } from "@/store/slices/auth-slice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useRouter } from "next/navigation";
import ProfileImageUploader from "./profile-img-uloader";
import { persistor } from "@/store";
import authService from "@/services/auth-service";

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const menuItems = [
    { name: "Edit Profile", Icon: Icons.UserIcon, href: "/profile/edit" },
    {
      name: "Get Hired",
      Icon: Briefcase,
      href: "/profile/get-hired"
    },
    { name: "Bookmarks", Icon: Icons.BookMarkIcon, href: "/profile/bookmark" },
    { name: "Transactions", Icon: Icons.WalletIcon, href: "/profile/transactions" },
    { name: "Address Book", Icon: Icons.BookIcon, href: "/profile/address-book" },
    { name: "Privacy Policy", Icon: Icons.LockIcon, href: "/profile/privacy-policy" },
    { name: "Terms & Conditions", Icon: ShieldX, href: "/profile/terms-&-conditions" },
    { name: "Help & Support", Icon: HelpingHand, href: "/profile/help-&-support" },
    { name: "Share Feedback", Icon: MessageSquare, href: "/profile/feedback" },
  ];

  const handleLogout = async () => {
    dispatch(logout());
    await persistor.purge();
    authService.logout();
    window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: null }));
    router.push("/onboarding");
  };

  // Redirect to onboarding if not authenticated - use useEffect to avoid render-time side effects
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, user, router]);

  // Return null while redirecting
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-[#F1FCEF] p-4 sm:p-6 pb-16 space-y-6">
      <div className="flex justify-between items-center bg-[#F1FCEF]">
        <h1 className="text-2xl leading-[120%] text-[#212121] font-bold flex items-center gap-4">
          <Image src={"/images/hwa-green-icon.png"} width={20} height={20} alt="icon" />
          More
        </h1>
      </div>

      <ProfileImageUploader />

      <Separator className="bg-[#EEEEEE]" />

      <div className="space-y-5">
        {menuItems.map(({ name, Icon, href }) => (
          <Link
            key={name}
            href={href}
            className="flex items-center justify-between rounded-lg transition-colors"
          >
            <div className="flex items-center gap-5">
              <Icon className="w-6 h-6 text-[#212121] stroke-[#212121]" />
              <span className="text-lg text-[#1B2431] leading-6">{name}</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ))}

        <div
          onClick={handleLogout}
          className="w-max p-0 leading-6 text-xl font-medium text-red-500 transition-colors flex items-center gap-5 cursor-pointer"
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
