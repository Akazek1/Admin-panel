import React from "react";

interface LoaderType {
  className?: string;
}

export default function BubbleLoader({ className }: LoaderType) {
  return <div className={`${className} loader`}></div>;
}
