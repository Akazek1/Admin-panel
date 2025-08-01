"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface BookmarkContextType {
    bookmarkedIds: Set<string>;
    toggleBookmark: (itemId: string, itemType: string) => Promise<void>;
    isBookmarked: (itemId: string) => boolean;
    isLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

interface BookmarkProviderProps {
    children: React.ReactNode;
}

export const BookmarkProvider: React.FC<BookmarkProviderProps> = ({ children }) => {
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);


    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const response = await api.get("/bookmarks/services", { withCredentials: true });
                type Bookmark = { serviceId?: string };
                const bookmarks: Bookmark[] = Array.isArray(response.data.data)
                    ? response.data.data
                    : [];
                const ids = new Set(
                    bookmarks
                        .filter((bookmark: Bookmark) => bookmark.serviceId && typeof bookmark.serviceId === "string")
                        .map((bookmark: Bookmark) => bookmark.serviceId as string)
                );
                setBookmarkedIds(ids);
            } catch (error) {
                console.error("Failed to fetch bookmarks:", error);
                setBookmarkedIds(new Set());
            }
        };

        if (isAuthenticated) {
            fetchBookmarks();
        }
    }, [isAuthenticated]);



    const toggleBookmark = useCallback(async (itemId: string, itemType: string) => {
        setIsLoading(true);
        const isCurrentlyBookmarked = bookmarkedIds.has(itemId);

        try {
            if (isCurrentlyBookmarked) {
                // Remove bookmark
                await api.delete(`/bookmarks/${itemType}/${itemId}`);
                setBookmarkedIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(itemId);
                    return newSet;
                });
                toast.success("Bookmark removed");
            } else {
                // Add bookmark
                await api.post(`/bookmarks/${itemType}/${itemId}`);
                setBookmarkedIds((prev) => new Set(prev).add(itemId));
                toast.success("Bookmark added");
            }
        } catch (error) {
            toast.error("Please wait and try again.");
            console.error("Bookmark error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [bookmarkedIds]);

    const isBookmarked = useCallback((itemId: string) => bookmarkedIds.has(itemId), [bookmarkedIds]);

    return (
        <BookmarkContext.Provider value={{ bookmarkedIds, toggleBookmark, isBookmarked, isLoading }}>
            {children}
        </BookmarkContext.Provider>
    );
};

export const useBookmark = (itemType: string = "services") => {
    const context = useContext(BookmarkContext);
    if (!context) {
        throw new Error("useBookmark must be used within a BookmarkProvider");
    }

    const { toggleBookmark, isBookmarked, isLoading } = context;

    const toggle = (itemId: string) => toggleBookmark(itemId, itemType);

    return {
        isBookmarked,
        toggleBookmark: toggle,
        isLoading,
    };
};