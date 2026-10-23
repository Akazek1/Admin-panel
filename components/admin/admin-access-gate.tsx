"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ADMIN_ACCESS_STALE_EVENT } from "@/lib/axios-instance"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { ADMIN_ACCESS_QUERY_KEY, canAccess, useAdminAccess } from "@/lib/admin-access"
import { PAGE_ACCESS, pageAccessFor } from "@/constant/admin-pages"
import { EmptyState } from "@/components/admin/admin-primitives"
import { LogoutButton } from "@/components/logout-button"
import { Button } from "@/components/ui/button"

const CHANGE_PASSWORD = "/admin/change-password"
// Pages never used as a landing page for someone who can't see the dashboard.
const NOT_LANDING = new Set(["/admin/settings", CHANGE_PASSWORD])

/**
 * Shows an admin page only to staff whose role can open it, and holds anyone
 * with a temporary password on the change-password screen. Display only — the
 * API refuses the same things on its own.
 */
export function AdminAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: access, isLoading, isError, error, refetch } = useAdminAccess()
  const denied = [401, 403].includes((error as any)?.response?.status)
  const queryClient = useQueryClient()

  // Re-check access as soon as the API refuses something, instead of waiting
  // for the cache to expire — the role may have just changed.
  useEffect(() => {
    const refresh = () => {
      // Polling pages can 403 repeatedly; one re-check every few seconds is plenty.
      const updatedAt = queryClient.getQueryState(ADMIN_ACCESS_QUERY_KEY)?.dataUpdatedAt ?? 0
      if (Date.now() - updatedAt < 5_000) return
      queryClient.invalidateQueries({ queryKey: ADMIN_ACCESS_QUERY_KEY })
    }
    window.addEventListener(ADMIN_ACCESS_STALE_EVENT, refresh)
    return () => window.removeEventListener(ADMIN_ACCESS_STALE_EVENT, refresh)
  }, [queryClient])

  const allowed = canAccess(access, pageAccessFor(pathname))
  const landing = access
    ? Object.keys(PAGE_ACCESS).find((url) => !NOT_LANDING.has(url) && canAccess(access, PAGE_ACCESS[url]))
    : undefined

  useEffect(() => {
    if (!access) return
    if (access.mustChangePassword && pathname !== CHANGE_PASSWORD) router.replace(CHANGE_PASSWORD)
    else if (!allowed && pathname === "/admin" && landing) router.replace(landing)
  }, [access, allowed, landing, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError && !denied) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 pt-24 text-center">
        <EmptyState title="Can't reach the server" description="Check your connection and try again." icon={Lock} />
        <Button variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    )
  }

  if (isError || !access?.isStaff) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6 pt-24">
        <EmptyState
          title="No admin access"
          description="This account isn't staff, or its access was removed. Sign in with a staff account."
          icon={Lock}
        />
        <LogoutButton />
      </div>
    )
  }

  if (access.mustChangePassword && pathname !== CHANGE_PASSWORD) return null
  if (!allowed && pathname === "/admin" && landing) return null

  if (!allowed) {
    return (
      <div className="mx-auto max-w-[1500px] p-6">
        <EmptyState
          title="You don't have access to this page"
          description={`Your role${access.roleName ? ` (${access.roleName})` : ""} doesn't include it. Ask the owner if you need it.`}
          icon={Lock}
        />
      </div>
    )
  }

  return <>{children}</>
}
