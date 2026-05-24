"use client"

import { Home, Users, Workflow, Settings, ShieldCheck, Flag, Star, ScrollText, Tag, Building2, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "./logout-button"
import { APP_CONFIG } from "@/constant/app.config"

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
    icon: Clock,
  },
  {
    title: "Completed Bookings",
    url: "/admin/completed-bookings",
    icon: CheckCircle,
  },
  {
    title: "Services",
    url: "/admin/services",
    icon: Workflow,
  },
  {
    title: "Verifications",
    url: "/admin/verifications",
    icon: ShieldCheck,
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: Flag,
  },
  {
    title: "Reviews",
    url: "/admin/reviews",
    icon: Star,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: Tag,
  },
  {
    title: "Organizations",
    url: "/admin/organizations",
    icon: Building2,
  },
  {
    title: "Audit Logs",
    url: "/admin/audit-logs",
    icon: ScrollText,
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
        <Image src="/hwa-green-icon.png" width={28} height={28} alt={APP_CONFIG.name} className="" />
        <div>
          <h2 className="text-lg font-semibold text-darkText">{APP_CONFIG.name}</h2>
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