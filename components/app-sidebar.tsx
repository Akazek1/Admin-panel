"use client"

import {
  Inbox,
  Settings,
  Users,
  ShoppingCart,
  Package,
  LineChart,
  ChevronUp,
  Bell,
  LayoutDashboard,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Menu items for the sidebar
const mainNavigation = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "#",
    icon: ShoppingCart,
    badge: 6,
  },
  {
    title: "Products",
    url: "#",
    icon: Package,
  },
  {
    title: "Customers",
    url: "#",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "#",
    icon: LineChart,
  },
]

const settingsNavigation = [
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
  {
    title: "Support",
    url: "#",
    icon: Inbox,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-2">
        <Link href="/" className="flex items-center gap-2 font-semibold px-2">
          <LayoutDashboard className="h-6 w-6" />
          <span className="group-data-[state=collapsed]:hidden">Admin Dashboard</span>
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="ml-auto h-8 w-8 group-data-[state=collapsed]:hidden bg-transparent"
        >
          <Bell className="h-4 w-4" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.url === "/"}>
                    <Link href={item.url}>
                      <item.icon />
                      <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                      {item.badge && (
                        <SidebarMenuBadge className="group-data-[state=collapsed]:hidden">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="group-data-[state=collapsed]:hidden" />

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Image
                    src="/placeholder.svg?height=32&width=32"
                    width={32}
                    height={32}
                    alt="Avatar"
                    className="rounded-full"
                  />
                  <span className="group-data-[state=collapsed]:hidden">John Doe</span>
                  <ChevronUp className="ml-auto h-4 w-4 group-data-[state=collapsed]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
