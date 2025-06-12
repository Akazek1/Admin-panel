// icons.tsx
import { JSX, SVGProps } from "react";
import FlowerIcon from "@/public/svg/flower.svg";
import HomeIcon from "@/public/svg/home.svg";
import SettingIcon from "@/public/svg/setting.svg";
import MessageIcon from "@/public/svg/message.svg";
import GetHiredIcon from "@/public/svg/get-hired.svg";
import Location from "@/public/svg/location.svg";
import Language from "@/public/svg/language.svg";
import BellIcon from "@/public/svg/bell-icon.svg";
import SearchIcon from "@/public/svg/search.svg";
import FilerIcon from "@/public/svg/filter.svg";
import NextIcon from "@/public/svg/next.svg";
import HeartIcon from "@/public/svg/heart-icon.svg";
import BookMarkIcon from "@/public/svg/bookmark-icon.svg";
import BagIcon from "@/public/svg/bag.svg";
import ClockIcon from "@/public/svg/clock.svg";
import UserIcon from "@/public/svg/user.svg";
import WalletIcon from "@/public/svg/wallet.svg";
import LockIcon from "@/public/svg/lock.svg";
import OrderHistoryIcon from "@/public/svg/order-history.svg";
import BookIcon from "@/public/svg/book.svg";
import Exit from "@/public/svg/exit.svg";
import Gallery from "@/public/svg/gallery-icon.svg";
import Mic from "@/public/svg/mic-icon.svg";
import { PackageOpen } from "lucide-react"

export const Icons = {
  FlowerIcon,
  HomeIcon,
  SettingIcon,
  MessageIcon,
  GetHiredIcon,
  Location,
  Language,
  BellIcon,
  SearchIcon,
  FilerIcon,
  NextIcon,
  HeartIcon,
  BookMarkIcon,
  BagIcon,
  ClockIcon,
  UserIcon,
  WalletIcon,
  LockIcon,
  OrderHistoryIcon,
  BookIcon,
  Exit,
  Gallery,
  Mic,
  PackageOpen
} as const;

export type IconType = keyof typeof Icons;
export type IconComponentType = (props: SVGProps<SVGSVGElement>) => JSX.Element;
