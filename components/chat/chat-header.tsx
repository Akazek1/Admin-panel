import React from "react";
import { BellIcon } from "lucide-react";

const ChatHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[10px]">
        <div className="bg-gradient-to-l from-[#145B10] to-[#729D70] w-8 h-8 flex items-center justify-center rounded-xl">
          <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <rect y="0.5" width="17.394" height="13.5591" fill="url(#pattern0_159_12477)" />
            <defs>
              <pattern id="pattern0_159_12477" patternContentUnits="objectBoundingBox" width="1" height="1">
                <use xlinkHref="#image0_159_12477" transform="scale(0.00393701 0.00505051)" />
              </pattern>
              <image id="image0_159_12477" width="254" height="198" preserveAspectRatio="none" xlinkHref="data:image/png;base64,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" />
            </defs>
          </svg>

        </div>
        <h1 className="font-bold text-2xl leading-[120%]">Inbox</h1>
      </div>
      <BellIcon />
    </div>
  );
};

export default ChatHeader;
