"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"
import { clearCachedAccess, readCachedAccess, writeCachedAccess } from "@/lib/admin-access-cache"

// What the signed-in staff member may do, from GET /admin/me/access. The
// backend enforces every permission on its own; this only decides what the
// panel shows, so hiding something here is never the security boundary.
export interface AdminAccess {
  isOwner: boolean
  isStaff: boolean
  roleId: string | null
  roleName: string | null
  displayName: string | null
  email: string | null
  // Role permissions plus owner-granted extras.
  permissions: string[]
  extraPermissions: string[]
  mustChangePassword: boolean
}

export const ADMIN_ACCESS_QUERY_KEY = ["admin-access"] as const

export async function getMyAccess(): Promise<AdminAccess> {
  try {
    const res = await axiosInstance.get("/admin/me/access")
    const access: AdminAccess = res.data?.data ?? res.data
    // Remembered so the next page load can draw before this call returns.
    writeCachedAccess(access)
    return access
  } catch (err: any) {
    // Refused: the remembered copy is wrong, never show it again.
    if ([401, 403].includes(err?.response?.status)) clearCachedAccess()
    throw err
  }
}

// Layout effect in the browser (runs before paint, so no spinner flash);
// plain effect on the server, where a layout effect only logs a warning.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

export function useAdminAccess() {
  const queryClient = useQueryClient()

  // On a fresh page load, start from the access this browser saw last time so
  // the sidebar and page render at once. It is seeded as already stale
  // (updatedAt 0), so the query below still asks the API straight away and
  // replaces it. Done after mount, not as initialData, so the first client
  // render matches the server-rendered HTML.
  useBrowserLayoutEffect(() => {
    if (queryClient.getQueryData(ADMIN_ACCESS_QUERY_KEY) !== undefined) return
    const cached = readCachedAccess()
    if (cached) queryClient.setQueryData(ADMIN_ACCESS_QUERY_KEY, cached, { updatedAt: 0 })
  }, [queryClient])

  return useQuery<AdminAccess>({
    queryKey: ADMIN_ACCESS_QUERY_KEY,
    queryFn: getMyAccess,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    // Retry network blips; a 401/403 is a real answer.
    retry: (count, err: any) => count < 3 && ![401, 403].includes(err?.response?.status),
  })
}

/**
 * Who may open a page:
 * - "staff": any staff member
 * - "owner": the owner only
 * - string[]: staff holding ANY of these permissions
 */
export type PageAccess = "staff" | "owner" | string[]

export function canAccess(access: AdminAccess | undefined, rule: PageAccess): boolean {
  if (!access?.isStaff) return false
  if (access.isOwner) return true
  if (rule === "staff") return true
  if (rule === "owner") return false
  return rule.some((p) => access.permissions.includes(p))
}

export function hasPermission(access: AdminAccess | undefined, permission: string): boolean {
  return !!access && (access.isOwner || access.permissions.includes(permission))
}

/** Hide UI the caller can't use. The API still refuses it if they try. */
export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  const { data } = useAdminAccess()
  return hasPermission(data, permission) ? <>{children}</> : null
}

/** `const can = useCan(); can("users.ban")` — for hiding controls a role can't use. */
export function useCan() {
  const { data } = useAdminAccess()
  return (permission: string) => hasPermission(data, permission)
}
