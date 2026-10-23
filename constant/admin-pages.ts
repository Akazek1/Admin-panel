import type { PageAccess } from "@/lib/admin-access"

// Who may open each admin page. Used by the sidebar (to hide links) and by
// AdminAccessGate (to block the page). The backend enforces the same rules on
// every API call; keep this in step with src/common/admin-access/permissions.ts.
export const PAGE_ACCESS: Record<string, PageAccess> = {
  "/admin": ["dashboard.view"],
  "/admin/support": ["support.view"],
  "/admin/users": ["users.view"],
  "/admin/signup-attempts": ["signup_attempts.view", "funnel.view"],
  "/admin/agencies": ["orgs.view"],
  "/admin/companies": ["orgs.view"],
  "/admin/organizations": ["orgs.view"],
  "/admin/enrollments": ["enrollments.view"],
  "/admin/pending-bookings": ["bookings.view"],
  "/admin/active-bookings": ["bookings.view"],
  "/admin/completed-bookings": ["bookings.view"],
  "/admin/services": ["services.view"],
  "/admin/conversations": ["conversations.view"],
  "/admin/verifications": ["verifications.view"],
  "/admin/company-services": ["company_services.review"],
  "/admin/reports": ["reports.view"],
  "/admin/disputes": ["reports.view"],
  "/admin/reviews": ["reviews.view"],
  "/admin/service-categories": ["taxonomy.manage"],
  "/admin/categories": ["taxonomy.manage"],
  "/admin/banners": ["banners.manage"],
  "/admin/announcements": ["announcements.manage"],
  "/admin/languages": ["languages.manage"],
  "/admin/legal": ["legal.edit"],
  "/admin/audit-logs": ["audit_logs.view"],
  "/admin/staff": "owner",
  "/admin/roles-permissions": "owner",
  "/admin/settings": "staff",
  "/admin/change-password": "staff",
}

/** The rule for a pathname: its own entry, else its closest parent's. Unknown pages are owner-only. */
export function pageAccessFor(pathname: string): PageAccess {
  let path = pathname.replace(/\/+$/, "") || "/"
  if (path === "/admin") return PAGE_ACCESS["/admin"]
  // Walk up to (but not including) "/admin" so an unknown page never inherits the dashboard rule.
  while (path.startsWith("/admin/")) {
    if (PAGE_ACCESS[path]) return PAGE_ACCESS[path]
    path = path.slice(0, path.lastIndexOf("/"))
  }
  return "owner"
}
