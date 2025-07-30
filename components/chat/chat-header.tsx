import React from "react";
import {  MessageSquare } from "lucide-react";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <MessageSquare className="w-8 h-8 text-white bg-gradient-to-l from-[#145B10] to-[#729D70] p-1 rounded-xl" />
        <h1 className="font-bold text-2xl leading-[120%]">Inbox</h1>
      </div>
      {/* <BellIcon /> */}
    </div>
  );
};

export default ChatHeader;