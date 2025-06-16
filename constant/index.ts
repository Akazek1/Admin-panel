import { NavItem } from "@/types";

export const navItems: NavItem[] = [
  { title: "Home", url: "/", icon: "HomeIcon" },
  { title: "Order History", url: "/order-history", icon: "PackageOpen" },
  { title: "Message", url: "/conversations", icon: "MessageIcon" },
  {
    title: "More",
    url: "/profile",
    icon: "SettingIcon",
    matchPattern: "/profile/*",
  },
];

export const PrivacyPolicyData = [
  {
    id: 1,
    title: "Types of Data We Collect",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    id: 2,
    title: "Use of Your Personal Data",
    content:
      "Magna etiam tempor orci eu lobortis elementum nibh. Vulputate enim nulla aliquet porttitor lacus. Orci sagittis eu vulputate odio. Cras semper auctor neque vitae tempus quam pellentesque nec. Non quam lacus suspendisse faucibus interdum posuere lorem ipsum dolor. Commodo elit at imperdiet dui. Nisi vitae suscipit tellus mauris a diam. Erat pellentesque adipiscing commodo elit at imperdiet dui. Mi ipsum faucibus vitae aliquet nec ullamcorper. Pellentesque pulvinar pellentesque habitant morbi tristique senectus et.",
  },
  {
    id: 3,
    title: "Disclosure of Your Personal Data",
    content:
      "Consequat id porta nibh venenatis cras sed. Ipsum nunc aliquet bibendum enim facilisis gravida neque. Nibh tellus molestie nunc non blandit massa. Quam pellentesque nec nam aliquam sem et tortor consequat id. Faucibus vitae aliquet nec ullamcorper sit amet risus. Nunc consequat interdum varius sit amet. Eget magna fermentum iaculis eu non diam phasellus vestibulum. Pulvinar pellentesque habitant morbi tristique senectus et. Lorem donec massa sapien faucibus et molestie. Massa tempor nec feugiat nisl pretium fusce id. Lacinia at quis risus sed vulputate odio. Integer vitae justo eget magna fermentum iaculis. Eget gravida cum sociis natoque penatibus et magnis.",
  },
];
