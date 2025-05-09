import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css"; 
import Layout from "@/components/layout/pwa-layout"; 
import { Toaster } from "react-hot-toast"; 
import { Providers } from "@/store/provider"; 

// Load Geist fonts
const geistSans = Geist({
  variable: "--font-geist-sans", 
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Load Urbanist font with specified weights
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "700"], 
  variable: "--font-urbanist", 
  display: "swap",
});

export const metadata: Metadata = {
  title: "HWA - House Working App", 
  description: "Welcome to House Working App", 
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable}`}>
      <body className="antialiased">
        <Providers>
          <Layout>
            <Toaster position="top-center" />
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
