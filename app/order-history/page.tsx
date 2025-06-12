"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import BackButtonHeader from "@/components/header/back-button-header";
import {  CircleCheck } from "lucide-react";
import { Icons } from "@/components/icons";

// Sample order data (replace with actual data from your backend or state)
const orderHistory = [
  {
    category: "ELECTRICIAN",
    orders: [
      {
        status: "Job Completed",
        provider: "Mutanghua",
        profession: "Electrician",
        date: "Monday, 26th January 2024",
        amount: "800 RWF",
      },
      {
        status: "Job Cancelled",
        provider: "Mutanghua",
        profession: "Electrician",
        date: "Monday, 26th January 2024",
        bookAgain: true,
      },
    ],
  },
  {
    category: "PLUMBER",
    orders: [
      {
        status: "Job Completed",
        provider: "Mutanghua",
        profession: "Plumber",
        date: "Monday, 26th January 2024",
        amount: "800 RWF",
      },
      {
        status: "Job Cancelled",
        provider: "Mutanghua",
        profession: "Plumber",
        date: "Monday, 26th January 2024",
        bookAgain: true,
      },
    ],
  },
];

const OrderHistory: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F1FCEF]">
      <BackButtonHeader text="Order History" className="p-4" backHref="/" />

      {/* Order History List */}
      <div className="px-4 py-6 mb-6 ">
        {orderHistory.map((category, index) => (
          <div key={index} className="space-y-6">
            {/* Category Header */}
            <h2 className="text-xl font-bold text-[#212121] Capitalize">
              {category.category}
            </h2>

            {/* Orders under this category */}
            <div className="space-y-3 ">
              {category.orders.map((order, orderIndex) => (
                <div
                  key={orderIndex}
                  className="bg-white/50 shadow-sm p-5 space-y-3 rounded-[32px] border border-gray-100"
                >
                  {/* Status and Expand Icon */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs  text-white font-bold text-[10px] py-1 px-2.5 rounded-full ${order.status === "Job Completed"
                        ? "bg-[#145B10]"
                        : "bg-[#C01212]"
                        }`}
                    >
                      {order.status}
                    </span>
                    
                  </div>

                  {/* Provider and Profession */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#616161]">
                        {order.provider}
                      </p>
                      <p className="text-[#212121] text-lg font-bold">{order.profession}</p>
                    </div>
                    <Icons.BookMarkIcon className="stroke-[#145B10]" />
                  </div>

                  {/* Date */}
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-gray-400 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-[#616161] font-medium">{order.date}</p>
                  </div>

                  <div className="flex items-center justify-between w-full">
                    {/* Amount Paid (if applicable) */}
                    {order.amount && (
                      <div className="flex items-center mt-1">
                        <CircleCheck className="w-4 h-4  mr-1" />
                        <p className="text-xs text-[#145B10] w-max font-bold">
                          Amount Paid {order.amount}
                        </p>
                      </div>
                    )}

                    {/* Book Again Button */}
                    <div className="flex items-center justify-end w-full">
                      <Button
                        className=" w-max rounded-full
                       border border-[#145B10] text-[#145B10] font-bold bg-transparent hover:bg-[#145B10] hover:text-white py-2"
                        onClick={() => console.log(`Booking again with ${order.provider}`)}
                      >
                        Book Again
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;