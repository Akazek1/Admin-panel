import axiosInstance from "@/lib/axios-instance"

const unwrap = <T,>(res: { data: any }): T => res.data?.data ?? res.data

export interface PermissionDef {
  key: string
  label: string
  description: string
  risk?: "normal" | "high"
}

export interface PermissionGroup {
  key: string
  label: string
  permissions: PermissionDef[]
}

export interface RoleTemplate {
  name: string
  description: string
  color: string
  permissions: string[]
}

export interface AdminRole {
  id: string
  name: string
  description: string | null
  color: string
  permissions: string[]
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface StaffMember {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string
  email: string | null
  isBanned: boolean
  lastActiveAt: string | null
  adminMustChangePassword: boolean
  createdAt: string
  adminRole: { id: string; name: string; color: string } | null
}

export interface RoleInput {
  name: string
  description?: string
  color?: string
  permissions: string[]
}

export const getPermissionCatalog = async () =>
  unwrap<{ groups: PermissionGroup[]; templates: RoleTemplate[] }>(await axiosInstance.get("/admin/permissions/catalog"))

export const getRoles = async () => unwrap<AdminRole[]>(await axiosInstance.get("/admin/roles"))
export const createRole = async (input: RoleInput) => unwrap<AdminRole>(await axiosInstance.post("/admin/roles", input))
export const updateRole = async (id: string, input: Partial<RoleInput>) =>
  unwrap<AdminRole>(await axiosInstance.patch(`/admin/roles/${id}`, input))
export const deleteRole = async (id: string) => {
  await axiosInstance.delete(`/admin/roles/${id}`)
}

export const getStaff = async () => unwrap<StaffMember[]>(await axiosInstance.get("/admin/staff"))
export const addStaff = async (input: { userId: string; roleId: string; email?: string }) =>
  unwrap<{ userId: string; email: string; temporaryPassword: string }>(await axiosInstance.post("/admin/staff", input))
export const setStaffRole = async (id: string, roleId: string) => {
  await axiosInstance.patch(`/admin/staff/${id}/role`, { roleId })
}
export const resetStaffPassword = async (id: string, email?: string) =>
  unwrap<{ email: string; temporaryPassword: string }>(
    await axiosInstance.post(`/admin/staff/${id}/reset-password`, email ? { email } : {}),
  )
export const removeStaff = async (id: string) => {
  await axiosInstance.delete(`/admin/staff/${id}`)
}

export const apiError = (err: any, fallback: string) => {
  const message = err?.response?.data?.message
  return Array.isArray(message) ? message.join(" ") : message || fallback
}
