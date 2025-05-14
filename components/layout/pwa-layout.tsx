"use client";
import { usePathname } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register"];
  const shouldHideNavigation =
    hideNavigationPaths.includes(pathname) || pathname.startsWith("/conversations/inbox");

  return (
    <div className="bg-[#F1FCEF] max-w-[428px] mx-auto relative flex flex-col min-h-screen">
      {/* Main content area without overflow restrictions */}
      <main className="flex-1">{children}</main>

      {/* Fixed Navigation */}
      {!shouldHideNavigation && (
        <div className="max-w-[428px] fixed bottom-0 left-0 right-0 mx-auto w-full bg-white shadow-md z-20">
          <Navigation />
        </div>
      )}
    </div>
  );
};

export default Layout;