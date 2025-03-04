import React from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const AddressBook = () => {
  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6">
      {/* Header */}
      <BackButtonHeader text="Address Book" />
      <div className="flex items-center cursor-pointer gap-2 px-2">
        <Plus className="text-[#167021]" />
        <h1 className="text-[#167021] font-medium text-base leading-5">
          Add another address
        </h1>
      </div>
      <Separator />
      <div className="space-y-6">
        <h1 className="text-[#161616] text-base leading-5 font-semibold">
          Home
        </h1>
        <p className="text-[#757575] font-medium text-sm w-[63%]">
          FOREX GIVE & TAKE, BP. 663, Kigali, Rawanda
        </p>
      </div>
    </div>
  );
};

export default AddressBook;
