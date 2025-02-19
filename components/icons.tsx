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
} as const;

export type IconsType = keyof typeof Icons;
