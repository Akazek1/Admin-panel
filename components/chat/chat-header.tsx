import React from "react";
import { BellIcon } from "lucide-react";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            width="32"
            height="32"
            rx="12"
            fill="url(#paint0_linear_159_12467)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_159_12467"
              x1="32"
              y1="32"
              x2="-6.07713"
              y2="20.9599"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#145B10" />
              <stop offset="1" stopColor="#729D70" />
            </linearGradient>
          </defs>
        </svg>
        <h1>Inbox</h1>
      </div>
      <BellIcon />
    </div>
  );
};

export default ChatHeader;
