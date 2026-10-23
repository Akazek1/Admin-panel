"use client"

import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import axiosInstance from "@/lib/axios-instance"

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
  const res = await axiosInstance.get("/admin/me/access")
  return res.data?.data ?? res.data
}

export function useAdminAccess() {
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
