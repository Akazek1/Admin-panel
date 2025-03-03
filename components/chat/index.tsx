"use client";
import React from "react";
import ChatHeader from "./chat-header";
import SearchBar from "../search/search";
import ChatTabs from "./chat-tabs";
import ChatInbox from "./chat-inbox";

const Chat = () => {
  return (
    <div className="space-y-6">
      <ChatHeader />
      <SearchBar
        onSearch={(query) => console.log("Searching inbox for:", query)} // Example onSearch
        placeholder="Search Inbox"
      />
      <ChatTabs />
      <ChatInbox />
    </div>
  );
};

export default Chat;
