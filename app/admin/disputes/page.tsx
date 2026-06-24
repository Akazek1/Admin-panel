import { EmptyState, AdminPageHeader } from "@/components/admin/admin-primitives"
import { ShieldAlert } from "lucide-react"

export default function DisputesPage() {
  return (
    <div className="min-h-screen bg-[#101211] p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <AdminPageHeader
          title="Disputes"
          description="Review booking disputes when dispute workflows are enabled."
        />
        <EmptyState
          title="Dispute workflow is not connected yet"
          description="This page is ready in the admin portal, but no dispute backend route is currently wired."
          icon={ShieldAlert}
        />
      </div>
    </div>
  )
}
