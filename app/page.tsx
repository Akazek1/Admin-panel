import { Suspense } from "react";
import Homepage from "./(home)/overview/page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Homepage />
    </Suspense>
  );
}
