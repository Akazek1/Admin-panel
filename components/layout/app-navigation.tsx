"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { navItems } from "@/constant";
import Link from "next/link";

const Navigation = () => {
  const pathname = usePathname(); // Get the current route

  return (
    <nav className="w-full bg-white shadow-md border-t p-2">
      <div className="flex justify-around items-center">
        {navItems?.map((item) => {
          const IconComponent = item.icon ? Icons[item.icon] : null;
          const isActive = pathname === item.url;

          return (
            <Link
              key={item.title}
              href={item.url}
              className={`flex flex-col items-center text-[10px] leading-3 w-16 ${
                isActive ? "text-[#167021] font-semibold" : "text-[#9E9E9E]"
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`w-6 h-6 ${
                    isActive ? "stroke-[#167021]" : "stroke-[#9E9E9E]"
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
