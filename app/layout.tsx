// app/auth/layout.tsx
import type React from "react";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>

  );
}
