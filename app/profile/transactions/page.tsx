"use client";

import React, { Suspense } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import from shadcn/ui

const TransactionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "earned"; // Default to "earned"

  // Function to update the URL with the selected tab
  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="bg-[#F1FCEF]">
      {/* Header */}
      <BackButtonHeader text="Transaction" className="p-6" />

      {/* Tabs using shadcn/ui */}
      <Tabs value={currentTab} onValueChange={setTab} className="w-full">
        <TabsList className="flex justify-between  bg-transparent p-0">
          <TabsTrigger
            value="earned"
            className="py-2 px-4 text-lg font-medium w-[50%] rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-gray-500"
          >
            Earned
          </TabsTrigger>
          <TabsTrigger
            value="spend"
            className="py-2 px-4 text-lg font-medium w-[50%] rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-gray-500"
          >
            Spend
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="earned" className="mt-4">
          <p>Content for Earned transactions will go here.</p>
        </TabsContent>
        <TabsContent value="spend" className="mt-4">
          <p>Content for Spend transactions will go here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};



const Transaction = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <TransactionPage />
    </Suspense>
  );
}
export default Transaction;
