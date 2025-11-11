"use client";
import React from "react";
import { useViewMode } from "@/context/view-mode-context";
import { Briefcase, User } from "lucide-react";

const ViewModeToggle: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-md border border-gray-200">
      <button
        onClick={() => viewMode !== "employer" && toggleViewMode()}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
          viewMode === "employer"
            ? "bg-[#145B10] text-white shadow-sm"
            : "text-gray-600 hover:text-[#145B10]"
        }`}
      >
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">Employer</span>
      </button>
      <button
        onClick={() => viewMode !== "provider" && toggleViewMode()}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
          viewMode === "provider"
            ? "bg-[#145B10] text-white shadow-sm"
            : "text-gray-600 hover:text-[#145B10]"
        }`}
      >
        <Briefcase className="w-4 h-4" />
        <span className="text-sm font-medium">Provider</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;




