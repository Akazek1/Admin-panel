"use client";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Define props interface for the SearchBar
interface SearchBarProps {
  onSearch: (query: string) => void; // Callback for search queries
  placeholder?: string; // Optional custom placeholder text
  searchIcon?: React.ReactNode; // Optional custom search icon
  filterIcon?: React.ReactNode; // Optional custom filter icon
  className?: string; // Optional custom Tailwind classes for additional styling
  initialQuery?: string; // Optional initial query value
  onFocus?: () => void; // Optional callback for when the input is focused
  onBlur?: () => void; // Optional callback for when the input loses focus
}

// Default values for optional props
const defaultProps: Partial<SearchBarProps> = {
  placeholder: "Search...",
  searchIcon: (
    <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
  ),
  filterIcon: (
    <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
  ),
};

const SearchBar = ({
  onSearch,
  placeholder = defaultProps.placeholder,
  searchIcon = defaultProps.searchIcon,
  filterIcon = defaultProps.filterIcon,
  className = "",
  initialQuery = "",
  onFocus,
  onBlur,
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isActive, setIsActive] = useState(false);

  const handleFocus = () => {
    setIsActive(true);
    onFocus?.(); // Call optional onFocus callback
    onSearch(""); // Trigger search results immediately with an empty query when clicked
  };

  const handleBlur = () => {
    setIsActive(false);
    onBlur?.(); // Call optional onBlur callback
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // No search triggered on typing—only on focus
  };

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        <motion.div
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: isActive ? 1 : 1, opacity: isActive ? 1 : 0.8 }}
          exit={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative"
        >
          {searchIcon}
          <Input
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-12 border-[#D6D6D6] rounded-[40px] placeholder:text-xs placeholder:text-[#878787]"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {filterIcon}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
