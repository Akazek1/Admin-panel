import { Suspense } from "react";
import Homepage from "./(home)/overview/page";
import Loader from "@/components/loader/loader";

export default function Page() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={<Loader />}>
        <Homepage />
      </Suspense>
    </div>
  );
}
