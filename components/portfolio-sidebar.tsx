"use client"

import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  Clock,
  Flag,
  Home,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  Workflow,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "./logout-button"
import { APP_CONFIG } from "@/constant/app.config"

const navigationGroups = [
  {
    title: "Command Center",
    items: [{ title: "Overview", url: "/admin", icon: Home }],
  },
  {
    title: "Users",
    items: [
      { title: "User Directory", url: "/admin/users", icon: Users },
      { title: "Sub-admins", url: "/admin/sub-admins", icon: UserCog },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { title: "Pending Bookings", url: "/admin/pending-bookings", icon: Clock },
      { title: "Completed Bookings", url: "/admin/completed-bookings", icon: CheckCircle },
      { title: "Services", url: "/admin/services", icon: Workflow },
      { title: "Conversations", url: "/admin/conversations", icon: MessageSquare },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { title: "Verifications", url: "/admin/verifications", icon: ShieldCheck },
      { title: "Reports", url: "/admin/reports", icon: Flag },
      { title: "Reviews", url: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Categories", url: "/admin/categories", icon: Layers },
      { title: "Hero Banners", url: "/admin/banners", icon: ImageIcon },
      { title: "Announcements", url: "/admin/announcements", icon: Bell },
    ],
  },
  {
    title: "Organizations",
    items: [{ title: "Organizations", url: "/admin/organizations", icon: Building2 }],
  },
  {
    title: "Admin & Security",
    items: [
      { title: "Audit Logs", url: "/admin/audit-logs", icon: BarChart3 },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
]

export function PortfolioSidebar() {
  const pathname = usePathname()
  const isActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin"
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-gray-800 bg-darkBackground p-4 lg:flex">
      <div className="flex items-center gap-3 mb-8">
        <Image src="/hwa-green-icon.png" width={28} height={28} alt={APP_CONFIG.name} className="" />
        <div>
          <h2 className="text-lg font-semibold text-darkText">{APP_CONFIG.name}</h2>
          <p className="text-sm text-muted-foreground">ADMIN DASHBOARD</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-auto pr-1">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebarActive",
                  isActive(item.url) ? "bg-[#145B10] text-darkText" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </div>
        ))}
        <LogoutButton />
      </nav>
    </aside>
  )
}
