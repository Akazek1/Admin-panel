import Link from "next/link";
import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  linkText?: string;
  linkHref?: string;
  linkClassName?: string; // Custom styles for the "See All" link
  className?: string; // Custom styles for the container
  icon?: ReactNode; // Optional icon
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  linkText = "See All",
  linkHref = "#",
  linkClassName = "text-green-600 font-semibold flex items-center gap-1", // Default styles
  className = "",
  icon, // Optional icon
}) => {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <h2 className="text-lg leading-5 font-medium text-[#1B2431]">{title}</h2>
      {linkHref && (
        <Link href={linkHref} className={linkClassName}>
          {linkText} {icon && <>{icon}</>}
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
