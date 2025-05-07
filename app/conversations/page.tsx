import Chat from "@/components/chat";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense>
      <div className="flex flex-col h-full  space-y-6">
        <Chat />
      </div>
    </Suspense>
  );
};

export default page;
