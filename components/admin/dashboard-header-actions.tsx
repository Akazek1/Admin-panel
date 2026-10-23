"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell, KeyRound, LogOut, Search, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useSignOut } from "@/components/logout-button"
import { USERS_LIST_STATE_KEY } from "@/constant/list-state"
import { seedSessionState } from "@/hooks/use-session-state"
import { getAllUsers, type AdminStats } from "@/lib/api"
import { useAdminAccess, useCan } from "@/lib/admin-access"
import axiosInstance from "@/lib/axios-instance"

const userName = (u: { firstName: string | null; lastName: string | null; phoneNumber: string }) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.phoneNumber

/** The dashboard header's search, notifications and profile menu. */
export function DashboardHeaderActions({ stats }: { stats: AdminStats | undefined }) {
  const can = useCan()
  return (
    <div className="flex items-center gap-2">
      {can("users.view") ? <QuickSearch /> : null}
      <AttentionBell stats={stats} />
      <ProfileMenu />
    </div>
  )
}

function QuickSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  // Same cache as the Individuals page, so this is usually instant.
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: getAllUsers, staleTime: 5 * 60 * 1000, enabled: open })

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return (users ?? [])
      .filter((u) => `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.phoneNumber} ${u.email ?? ""} ${u.username ?? ""}`.toLowerCase().includes(term))
      .slice(0, 8)
  }, [users, q])

  const close = () => {
    setOpen(false)
    setQ("")
  }
  const openAll = () => {
    // Open Individuals already searched for this.
    seedSessionState(USERS_LIST_STATE_KEY, { searchTerm: q.trim(), currentPage: 1 })
    close()
    router.push("/admin/users")
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setOpen(true)} aria-label="Search people">
        <Search className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Find a person</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Name, phone, email or username"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) openAll()
            }}
          />
          {isLoading && q.trim() ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {matches.length ? (
            <ul className="max-h-80 divide-y divide-white/5 overflow-auto rounded-md border border-white/10">
              {matches.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/5"
                    onClick={() => {
                      close()
                      router.push(`/admin/users/${u.id}`)
                    }}
                  >
                    <span className="text-sm font-medium">{userName(u)}</span>
                    <span className="text-xs text-muted-foreground">{u.phoneNumber}{u.email ? ` · ${u.email}` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : q.trim() && !isLoading ? (
            <p className="text-sm text-muted-foreground">No one matches “{q.trim()}”.</p>
          ) : null}
          {q.trim() ? (
            <Button variant="outline" onClick={openAll}>
              See all results in Individuals
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Real "needs attention" counts — only the queues this role can open. */
function AttentionBell({ stats }: { stats: AdminStats | undefined }) {
  const can = useCan()
  const { data: support } = useQuery<{ unreadUsers: number }>({
    queryKey: ["support-counts"],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/support/counts")
      return res.data?.data ?? res.data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
    enabled: can("support.view"),
  })

  const items = [
    { label: "Unread support chats", count: support?.unreadUsers ?? 0, href: "/admin/support", show: can("support.view") },
    { label: "ID verifications to review", count: stats?.pendingVerifications ?? 0, href: "/admin/verifications", show: can("verifications.view") },
    { label: "Open reports", count: stats?.reports?.pending ?? 0, href: "/admin/reports", show: can("reports.view") },
    { label: "Bookings waiting for confirmation", count: stats?.pendingBookings ?? 0, href: "/admin/pending-bookings", show: can("bookings.view") },
    { label: "Agencies awaiting verification", count: stats?.pendingAgencies ?? 0, href: "/admin/agencies", show: can("orgs.view") },
    { label: "Companies awaiting verification", count: stats?.pendingCompanies ?? 0, href: "/admin/companies", show: can("orgs.view") },
  ].filter((i) => i.show)
  const total = items.reduce((sum, i) => sum + i.count, 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label={`Needs attention: ${total}`}>
          <Bell className="h-5 w-5" />
          {total ? (
            <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nothing for your role here.</p>
        ) : (
          items.map((i) => (
            <DropdownMenuItem key={i.href} asChild className={i.count ? "" : "text-muted-foreground"}>
              <Link href={i.href} className="flex w-full items-center justify-between gap-3">
                <span>{i.label}</span>
                <span className={i.count ? "rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-black" : "text-xs"}>
                  {i.count}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProfileMenu() {
  const { data: access } = useAdminAccess()
  const signOut = useSignOut()
  const roleLabel = access?.isOwner ? "Owner" : access?.roleName ?? "Staff"
  const initials = (access?.displayName ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-2 flex items-center gap-3 rounded-full border border-white/10 bg-card/70 px-3 py-2 text-left transition-colors hover:bg-white/5"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted font-semibold">
            {initials}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-card bg-emerald-400" />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold leading-tight">{access?.displayName ?? "—"}</span>
            <span className="block text-xs text-muted-foreground">{roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{access?.displayName ?? "—"}</span>
          <span className="block text-xs text-muted-foreground">{roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/change-password"><KeyRound className="mr-2 h-4 w-4" /> Change password</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-red-400 focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
