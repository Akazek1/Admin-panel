import React from "react";

interface LoaderType {
    className?: string;
}

export default function Loader({ className }: LoaderType) {
    return <div className={`${className} border-green-700 broder-2 animate-spin rounded-full bg-white h-4 w-4`}></div>;
}
