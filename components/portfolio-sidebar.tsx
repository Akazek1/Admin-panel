"use client"

import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Dot,
  FileText,
  Flag,
  FolderTree,
  Home,
  Image as ImageIcon,
  Languages,
  Layers,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  Workflow,
  BriefcaseBusiness,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "./logout-button"
import { APP_CONFIG } from "@/constant/app.config"

const navigationGroups = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: Home }],
  },
  {
    title: "Users",
    items: [
      { title: "Individuals", url: "/admin/users", icon: Users },
      { title: "Agencies", url: "/admin/agencies", icon: BriefcaseBusiness },
      { title: "Companies", url: "/admin/companies", icon: Building2 },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { title: "Pending Bookings", url: "/admin/pending-bookings", icon: Clock },
      { title: "Active Bookings", url: "/admin/active-bookings", icon: Dot },
      { title: "Completed Bookings", url: "/admin/completed-bookings", icon: CheckCircle },
      { title: "Services", url: "/admin/services", icon: Workflow },
      { title: "Conversations", url: "/admin/conversations", icon: MessageSquare },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { title: "Verifications", url: "/admin/verifications", icon: ShieldCheck },
      { title: "Company Services", url: "/admin/company-services", icon: ClipboardCheck },
      { title: "Reports", url: "/admin/reports", icon: Flag },
      { title: "Disputes", url: "/admin/disputes", icon: ShieldAlert },
      { title: "Reviews", url: "/admin/reviews", icon: Star },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Service Groupings", url: "/admin/service-categories", icon: FolderTree },
      { title: "Categories", url: "/admin/categories", icon: Layers },
      { title: "Hero Banners", url: "/admin/banners", icon: ImageIcon },
      { title: "Announcements", url: "/admin/announcements", icon: Bell },
      { title: "Languages", url: "/admin/languages", icon: Languages },
      { title: "Legal Documents", url: "/admin/legal", icon: FileText },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Sub-admins", url: "/admin/sub-admins", icon: UserCog },
      { title: "Audit Logs", url: "/admin/audit-logs", icon: BarChart3 },
      { title: "Roles & Permissions", url: "/admin/roles-permissions", icon: ShieldCheck },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
]

const DEFAULT_OPEN_GROUPS: Record<string, boolean> = {
  Overview: true,
  Users: true,
  Marketplace: true,
  "Trust & Safety": true,
  Content: false,
  Administration: false,
}

const STORAGE_KEY = "akazek-admin-sidebar-open-groups-v2"

export function PortfolioSidebar() {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigationGroups.map((group) => [group.title, DEFAULT_OPEN_GROUPS[group.title] ?? true]))
  )

  const isActive = (url: string) => {
    if (url === "/admin") return pathname === "/admin"
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as Record<string, boolean>
      setOpenGroups((current) => ({ ...current, ...parsed }))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  React.useEffect(() => {
    const activeGroup = navigationGroups.find((group) => group.items.some((item) => isActive(item.url)))
    if (!activeGroup || openGroups[activeGroup.title]) return

    setOpenGroups((current) => {
      const next = { ...current, [activeGroup.title]: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [pathname, openGroups])

  const toggleGroup = (title: string) => {
    setOpenGroups((current) => {
      const next = { ...current, [title]: !current[title] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-shrink-0 flex-col border-r border-white/10 bg-[#0f1110] p-4 lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <Image src="/hwa-green-icon.png" width={32} height={32} alt={APP_CONFIG.name} className="shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold leading-tight text-darkText">{APP_CONFIG.name}</h2>
          <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-auto pr-1">
        {navigationGroups.map((group) => {
          const isOpen = openGroups[group.title]
          const hasActiveItem = group.items.some((item) => isActive(item.url))

          return (
            <div key={group.title} className="space-y-1.5">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
                  hasActiveItem && "text-emerald-300"
                )}
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isOpen}
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>

              {isOpen && (
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-foreground",
                        isActive(item.url) ? "bg-[#145B10] text-darkText shadow-sm shadow-emerald-950/20" : "text-muted-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        <LogoutButton />
      </div>
    </aside>
  )
}
