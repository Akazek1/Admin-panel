import { redirect } from "next/navigation"

// Sub-admins became Staff (one role per person); keep old links working.
export default function SubAdminsRedirect() {
  redirect("/admin/staff")
}
