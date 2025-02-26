import type { Metadata } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/pwa-layout";
import { Toaster } from "react-hot-toast";

// Load Geist fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Load Urbanist font
const urbanist = Urbanist({
  subsets: ["latin"], // You can specify other subsets like "latin-ext" if needed
  weight: ["400", "700"], // Specify the weights you need (e.g., regular and bold)
  variable: "--font-urbanist", // Optional: creates a CSS variable for the font
  display: "swap", // Improves performance by swapping fonts (avoid FOUT)
});

export const metadata: Metadata = {
  title: "HWA - House Working App",
  description: "Welcome to House Working App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable}`}
    >
      <body className="antialiased">
        <Layout>
          <Toaster position="top-center" />
          {children}
        </Layout>
      </body>
    </html>
  );
}
