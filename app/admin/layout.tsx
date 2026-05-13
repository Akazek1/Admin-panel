// app/(app)/layout.tsx
import type React from "react";
import { PortfolioSidebar } from "@/components/portfolio-sidebar";
import { cookies } from "next/headers";
import "@/app/globals.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("access_token")?.value;

  return (
    <div>
      {token && <PortfolioSidebar />}
      <main className={`flex-1 overflow-auto ${token ? "ml-64" : ""}`}>
        {children}
      </main>
    </div>
  );
}
