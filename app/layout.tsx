// app/layout.tsx - Root layout for the Next.js app
import type React from "react";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
