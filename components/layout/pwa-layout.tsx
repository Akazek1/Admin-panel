"use client";
import { usePathname } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Define pages where the Navigation should NOT be visible
  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register"];
  const shouldShowNavigation = !hideNavigationPaths.includes(pathname);

  return (
    <div className="h-screen bg-[#F1FCEF] max-w-[428px] mx-auto overflow-hidden relative">
      <main className="flex-1">{children}</main>
      {shouldShowNavigation && (
        <div className="max-w-[428px] fixed bottom-0  mx-auto w-full">
          <Navigation />
        </div>
      )}
    </div>
  );
};

export default Layout;
