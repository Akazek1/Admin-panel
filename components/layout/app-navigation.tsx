"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { navItems } from "@/constant"; // Adjust the import path as needed
import Link from "next/link";
import { NavItem } from "@/types";

const Navigation = () => {
  const pathname = usePathname(); // Get the current route

  const isActive = (item: NavItem): boolean => {
    if (item.matchPattern) {
      // Check if the current pathname matches the pattern (e.g., "/profile/*")
      const pattern = item.matchPattern.replace("/*", ""); // Remove the "/*" for matching
      return pathname.startsWith(pattern);
    }
    // For items without a matchPattern, check exact URL match
    return pathname === item.url;
  };

  return (
    <nav className="w-full bg-white shadow-md border-t p-2">
      <div className="flex justify-around items-center">
        {navItems?.map((item) => {
          const IconComponent = item.icon ? Icons[item.icon] : null;
          const isActiveNav = isActive(item);

          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex flex-col items-center text-[10px] leading-3 w-16 ${
                isActiveNav ? "text-[#167021] font-semibold" : "text-[#9E9E9E]"
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`w-6 h-6 ${
                    isActiveNav ? "stroke-[#167021]" : "stroke-[#9E9E9E]"
                  }`}
                />
              )}
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
