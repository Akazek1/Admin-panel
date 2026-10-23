import { describe, expect, it } from "vitest"
import { PAGE_ACCESS, pageAccessFor } from "./admin-pages"
import { canAccess, type AdminAccess } from "@/lib/admin-access"

const staff = (permissions: string[]): AdminAccess => ({
  isOwner: false, isStaff: true, roleId: "r", roleName: "R", displayName: null, permissions, mustChangePassword: false,
})

describe("pageAccessFor", () => {
  it("uses a page's own rule, then its parent's", () => {
    expect(pageAccessFor("/admin/users")).toEqual(["users.view"])
    expect(pageAccessFor("/admin/users/abc-123")).toEqual(["users.view"])
    expect(pageAccessFor("/admin/")).toEqual(PAGE_ACCESS["/admin"])
  })

  it("treats unknown pages as owner-only, never as the dashboard", () => {
    expect(pageAccessFor("/admin/something-new")).toBe("owner")
    expect(pageAccessFor("/admin/sub-admins")).toBe("owner")
  })
})

describe("canAccess", () => {
  it("lets the owner open everything and staff only what their role allows", () => {
    const owner = { ...staff([]), isOwner: true }
    expect(canAccess(owner, "owner")).toBe(true)
    expect(canAccess(staff(["banners.manage"]), pageAccessFor("/admin/banners"))).toBe(true)
    expect(canAccess(staff(["banners.manage"]), pageAccessFor("/admin/users"))).toBe(false)
    expect(canAccess(staff(["banners.manage"]), "owner")).toBe(false)
    expect(canAccess(staff([]), "staff")).toBe(true)
  })

  it("gives nothing to non-staff or before access loads", () => {
    expect(canAccess(undefined, "staff")).toBe(false)
    expect(canAccess({ ...staff(["users.view"]), isStaff: false }, ["users.view"])).toBe(false)
  })

  it("opens the signup page with either the list or the funnel permission", () => {
    expect(canAccess(staff(["funnel.view"]), pageAccessFor("/admin/signup-attempts"))).toBe(true)
  })
})
