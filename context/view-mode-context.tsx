"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export type ViewMode = "provider" | "employer";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

interface ViewModeProviderProps {
  children: React.ReactNode;
}

const VIEW_MODE_STORAGE_KEY = "hwa_view_mode";

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Initialize from localStorage if available, default to "employer"
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return (saved === "provider" || saved === "employer") ? saved : "employer";
    }
    return "employer";
  });

  // Save to localStorage whenever viewMode changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }
  }, [viewMode]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
  };

  const toggleViewMode = () => {
    setViewModeState((prev) => (prev === "provider" ? "employer" : "provider"));
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
};




