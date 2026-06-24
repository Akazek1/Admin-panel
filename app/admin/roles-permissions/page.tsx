import Link from "next/link"
import { AdminPageHeader, EmptyState } from "@/components/admin/admin-primitives"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

export default function RolesPermissionsPage() {
  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Roles & Permissions"
          description="Manage internal admin access from the existing sub-admins workflow."
        >
          <Button asChild>
            <Link href="/admin/sub-admins">Open Sub-admins</Link>
          </Button>
        </AdminPageHeader>
        <EmptyState
          title="Permissions are managed through Sub-admins"
          description="This page keeps the navigation complete while the dedicated roles matrix is designed."
          icon={ShieldCheck}
        />
      </div>
    </div>
  )
}
