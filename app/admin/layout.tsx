import type React from "react";
import { PortfolioSidebar } from "@/components/portfolio-sidebar";
import { AdminAccessGate } from "@/components/admin/admin-access-gate";
import "@/app/globals.css";

// No cookies() here on purpose: reading the cookie made every /admin route
// server-rendered on each click. The middleware already keeps signed-out
// visitors away, and AdminAccessGate covers the rest on the client, so the
// shell can stay static and prefetchable.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PortfolioSidebar />
      <main className="min-h-screen flex-1 overflow-auto lg:ml-64">
        <AdminAccessGate>{children}</AdminAccessGate>
      </main>
    </div>
  );
}
