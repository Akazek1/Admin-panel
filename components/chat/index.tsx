"use client";
import React, { useState } from "react";
import ChatHeader from "./chat-header";
import CustomSearch from "../search/custom-search"; 
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState(""); 

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header area */}
      <div className="bg-[#f1faee] sticky top-0 p-4 sm:p-6 z-10 space-y-4">
        <ChatHeader />
        <CustomSearch
          onSearch={handleSearch}
          placeholder="Search Inbox"
        />
        <ChatTabs />
      </div>

      {/* Scrollable chat inbox */}
      <div className="flex-1 h-screen overflow-y-auto scrollbar-hide pb-14 px-6">
        <ChatInbox searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Chat;