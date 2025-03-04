"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

interface PageProp {
  text: string;
  className?: string | undefined;
  backHref?: string; // Optional prop for custom back URL
}

const BackButtonHeader: React.FC<PageProp> = ({
  text,
  className,
  backHref,
}) => {
  // Default back URL to "/profile" if not provided, or use previous route logic
  const defaultBackHref = backHref || "/profile";

  return (
    <div className={cn(`${className} flex items-center gap-4 rounded-lg`)}>
      <Link href={defaultBackHref} className="">
        <ArrowLeft className="w-6 h-6 text-[#1B2431]" />
      </Link>
      <h1 className="text-2xl leading-7 font-bold text-[#1B2431]">{text}</h1>
    </div>
  );
};

export default BackButtonHeader;
