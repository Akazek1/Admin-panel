// app/layout.tsx - Root layout for the Next.js app
import type React from "react";
import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

// The tab icon follows the browser's colour scheme: the white mark on dark tab
// bars, the black mark on light ones, so it never disappears into the bar.
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/brand/favicon-white.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/favicon-black.png", type: "image/png", media: "(prefers-color-scheme: light)" },
    ],
  },
};

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
