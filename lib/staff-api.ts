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
  // Owner-granted permissions on top of the role (grants only).
  adminExtraPermissions: string[]
  // STAFF = standalone panel account; older staff may still be on a client account.
  accountType: "INDIVIDUAL" | "COMPANY" | "STAFF"
  staffTitle: string | null
  // Set while the owner has paused their panel access.
  adminPausedAt: string | null
  createdAt: string
  adminRole: { id: string; name: string; color: string } | null
  // The same person's client account, if linked.
  staffClientAccount: { id: string; firstName: string | null; lastName: string | null } | null
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
export interface StaffActivity {
  id: string
  action: string
  targetType: string
  targetId: string
  createdAt: string
  actorId: string
  actor: { firstName: string | null; lastName: string | null } | null
}

export interface CreateStaffInput {
  firstName: string
  lastName: string
  email: string
  roleId: string
  staffTitle?: string
  clientAccountId?: string
}
export const createStaff = async (input: CreateStaffInput) =>
  unwrap<{ userId: string; email: string; temporaryPassword: string }>(await axiosInstance.post("/admin/staff", input))
export const setStaffClientLink = async (id: string, clientAccountId: string | null) => {
  await axiosInstance.put(`/admin/staff/${id}/client-link`, { clientAccountId })
}
export const setStaffRole = async (id: string, roleId: string) => {
  await axiosInstance.patch(`/admin/staff/${id}/role`, { roleId })
}
export const setStaffExtras = async (id: string, permissions: string[]) =>
  unwrap<{ permissions: string[] }>(await axiosInstance.put(`/admin/staff/${id}/extra-permissions`, { permissions }))
export const resetStaffPassword = async (id: string, email?: string) =>
  unwrap<{ email: string; temporaryPassword: string }>(
    await axiosInstance.post(`/admin/staff/${id}/reset-password`, email ? { email } : {}),
  )
export const removeStaff = async (id: string, confirmName: string) => {
  await axiosInstance.delete(`/admin/staff/${id}`, { data: { confirmName } })
}
export const getStaffMember = async (id: string) =>
  unwrap<StaffMember & { activity: StaffActivity[] }>(await axiosInstance.get(`/admin/staff/${id}`))
export const updateStaff = async (
  id: string,
  input: Partial<{ firstName: string; lastName: string; email: string; staffTitle: string }>,
) => {
  await axiosInstance.patch(`/admin/staff/${id}`, input)
}
export const pauseStaff = async (id: string) => {
  await axiosInstance.post(`/admin/staff/${id}/pause`)
}
export const resumeStaff = async (id: string) => {
  await axiosInstance.post(`/admin/staff/${id}/resume`)
}

export const apiError = (err: any, fallback: string) => {
  const message = err?.response?.data?.message
  return Array.isArray(message) ? message.join(" ") : message || fallback
}

export interface OwnerAccount {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  lastLoginAt: string | null
  createdAt: string
  isYou: boolean
}
export const changeOwnEmail = async (currentPassword: string, newEmail: string) =>
  unwrap<{ email: string }>(await axiosInstance.patch("/admin/me/email", { currentPassword, newEmail }))
export const getOwners = async () => unwrap<OwnerAccount[]>(await axiosInstance.get("/admin/owners"))
export const removeOwner = async (id: string, currentPassword: string, confirmEmail: string) => {
  await axiosInstance.delete(`/admin/owners/${id}`, { data: { currentPassword, confirmEmail } })
}
export const changeOwnName = async (firstName: string, lastName: string) =>
  unwrap<{ firstName: string; lastName: string }>(await axiosInstance.patch("/admin/me/name", { firstName, lastName }))
