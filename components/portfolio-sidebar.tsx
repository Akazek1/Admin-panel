"use client"

import { Home, Store, User, Rss, Mail, Twitter, Facebook, Dribbble, Users, Workflow, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "./logout-button"

const mainNavigation = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Pending Bookings",
    url: "/admin/pending-bookings",
    icon: Users,
  },
  {
    title: "Completed Bookings",
    url: "/admin/completed-bookings",
    icon: Users,
  },
  {
    title: "Services",
    url: "/admin/services",
    icon: Workflow,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
]

export function PortfolioSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-darkBackground p-4 flex flex-col fixed top-0 left-0 h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Image src="/hwa-green-icon.png" width={28} height={28} alt="Toby Belhome" className="" />
        <div>
          <h2 className="text-lg font-semibold text-darkText">HWA</h2>
          <p className="text-sm text-muted-foreground">ADMIN DASHBOARD</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-auto">
        {mainNavigation.map((item) => (
          <Link
            key={item.title}
            href={item.url}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebarActive",
              pathname === item.url ? "bg-[#145B10] text-darkText" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
        <LogoutButton />
      </nav>
    </aside>
  )
}