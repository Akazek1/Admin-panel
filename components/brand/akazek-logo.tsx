import Image from "next/image";
import { cn } from "@/lib/utils";

type AkazekLogoProps = {
  variant?: "mark" | "full";
  tone?: "brand" | "light";
  className?: string;
  markClassName?: string;
  wordClassName?: string;
};

export function AkazekLogo({
  variant = "full",
  tone = "brand",
  className,
  markClassName,
  wordClassName,
}: AkazekLogoProps) {
  const colorClass = tone === "light" ? "text-white" : "text-[#145B10]";
  const markSrc = tone === "light" ? "/brand/akazek-mark-white.png" : "/brand/akazek-mark-dark.png";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", colorClass, className)}>
      <Image
        src={markSrc}
        width={128}
        height={128}
        alt=""
        aria-hidden="true"
        className={cn("h-8 w-8 shrink-0 object-contain", markClassName)}
      />
      {variant === "full" ? (
        <span className={cn("min-w-0 truncate text-base font-black leading-none tracking-normal", wordClassName)}>
          Akazek
        </span>
      ) : null}
    </span>
  );
}
