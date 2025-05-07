"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";


interface CustomSearchProps {
    onSearch: (query: string) => void; 
    placeholder?: string; 
    className?: string; 
}

const defaultProps: Partial<CustomSearchProps> = {
    placeholder: "Search...",
};

const CustomSearch = ({
    onSearch,
    placeholder = defaultProps.placeholder,
    className = "",
}: CustomSearchProps) => {
    const [query, setQuery] = useState("");
    const [isActive, setIsActive] = useState(false);

    const handleFocus = () => {
        setIsActive(true);
        console.log("CustomSearch focused");
    };

    const handleBlur = () => {
        setIsActive(false);
        console.log("CustomSearch blurred"); 
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onSearch(newQuery); // Trigger search on every change
        console.log("CustomSearch input changed, value:", newQuery); 
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
                    <Icons.SearchIcon className="absolute left-3 top-3 w-4 h-4 fill-[#878787]" />
                    <Input
                        type="text"
                        placeholder={placeholder}
                        className="pl-10 pr-12 border-[#D6D6D6] rounded-[40px] placeholder:text-xs placeholder:text-[#878787]"
                        value={query}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    <Icons.FilerIcon className="absolute right-4 top-3 w-[18px] h-[18px] fill-[#145B10]" />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default CustomSearch;