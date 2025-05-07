"use client";
import React, { Suspense } from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OrderHistoryPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get("tab") || "Service Given"; // Default to "Service Given"

    // Function to update the URL with the selected tab
    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tab);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Sample data for Service Given and Service Taken (you can replace this with API data)
    const serviceGivenData = [
        {
            orderId: "#SG321442",
            services: "House Cleaning",
            dateTime: "Dec 23, 2024 | 10:00 AM",
            concernedPerson: "Gasimba",
            workingHours: "2 hours",
            amountEarned: "$2",
        },
        {
            orderId: "#SG321442",
            services: "House Cleaning",
            dateTime: "Dec 23, 2024 | 10:00 AM",
            concernedPerson: "Gasimba",
            workingHours: "2 hours",
            amountEarned: "$2",
        },
        // Add more sample data as needed
    ];

    const serviceTakenData = [
        {
            orderId: "#ST123456",
            services: "Laundry Service",
            dateTime: "Dec 22, 2024 | 2:00 PM",
            concernedPerson: "John Doe",
            workingHours: "1.5 hours",
            amountPaid: "$5",
        },
        // Add more sample data as needed
    ];

    return (
        <div className="font-urbanist">
            <BackButtonHeader text="Order History" className="p-6" />
            {/* Tabs using shadcn/ui */}
            <Tabs value={currentTab} onValueChange={setTab} className="w-full">
                <TabsList className="flex justify-between bg-transparent p-0">
                    <TabsTrigger
                        value="Service Given"
                        className="py-2 px-4 text-lg font-semibold leading-6 w-[50%] rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-[#9E9E9E] "
                    >
                        Service Given
                    </TabsTrigger>
                    <TabsTrigger
                        value="Service Taken"
                        className="py-2 px-4 text-lg  w-[50%] rounded-none data-[state=active]:text-green-800 data-[state=active]:border-b-4 data-[state=active]:border-green-800 data-[state=inactive]:text-[#9E9E9E] font-semibold leading-6"
                    >
                        Service Taken
                    </TabsTrigger>
                </TabsList>

                {/* Tab Content for Service Given */}
                <TabsContent value="Service Given" className="p-6">
                    {serviceGivenData.length > 0 ? (
                        serviceGivenData.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 space-y-5 mb-5 rounded-lg shadow-sm border border-gray-200"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Order ID</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.orderId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Services</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.services}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Date & Time</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.dateTime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Concerned Person</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.concernedPerson}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Working Hours</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.workingHours}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Amount Earned</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.amountEarned}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-[#616161] font-medium">No services given yet.</p>
                    )}
                </TabsContent>

                {/* Tab Content for Service Taken */}
                <TabsContent value="Service Taken" className="p-6">
                    {serviceTakenData.length > 0 ? (
                        serviceTakenData.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white p-4 space-y-5 mb-5 rounded-lg shadow-sm border border-gray-200"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Order ID</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.orderId}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Services</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.services}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Date & Time</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.dateTime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Concerned Person</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.concernedPerson}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Working Hours</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.workingHours}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#616161] font-medium">Amount Paid</span>
                                    <span className="font-semibold text-[#424242] leading-6 text-[16px]">{item.amountPaid}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-[#616161] font-medium">No services taken yet.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};


const OrderHistory = () => {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <OrderHistoryPage />
        </Suspense>
    );
}

export default OrderHistory;