"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import from shadcn/ui

interface ChatTabsProps {
  onTabChange?: (tab: string) => void; // Optional callback for external components
}

const ChatTabs = ({ onTabChange }: ChatTabsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "All"; // Default to "All"

  // Function to update the URL with the selected tab
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
    onTabChange?.(tab); // Notify external components of tab change
  };

  return (
    <div className="">
      {/* Tabs using shadcn/ui */}
      <Tabs value={currentTab} onValueChange={setTab} className="w-full">
        <TabsList className="flex justify-between bg-transparent p-0">
          <TabsTrigger
            value="All"
            className="py-2 px-4 text-lg font-bold leading-6 w-full rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-gray-500"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="Read"
            className="py-2 px-4 text-lg font-bold leading-6 w-full rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-gray-500"
          >
            Read
          </TabsTrigger>
          <TabsTrigger
            value="Unread"
            className="py-2 px-4 text-lg font-bold leading-6 w-full rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-gray-500"
          >
            Unread
          </TabsTrigger>
        </TabsList>

        {/* Tab Content will be handled by ChatInbox */}
      </Tabs>
    </div>
  );
};

export default ChatTabs;
