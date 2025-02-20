"use client";
import { usePathname } from "next/navigation";
import Navigation from "@/components/layout/app-navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Define pages where the Navigation should NOT be visible
  const hideNavigationPaths = ["/onboarding", "/auth/login", "/auth/register"];
  const shouldShowNavigation = !hideNavigationPaths.includes(pathname);

  return (
    <div className="bg-[#F1FCEF] max-w-[428px] mx-auto relative flex flex-col min-h-screen overflow-hidden">
      {/* Main content area with vertical scrolling only */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[60px]">
        {children}
      </main>

      {/* Fixed Navigation */}
      {shouldShowNavigation && (
        <div className="max-w-[428px] fixed bottom-0 left-0 right-0 mx-auto w-full bg-white shadow-md">
          <Navigation />
        </div>
      )}
    </div>
  );
};

export default Layout;
