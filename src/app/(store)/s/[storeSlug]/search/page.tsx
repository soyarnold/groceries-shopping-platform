import { Suspense } from "react";
import StoreSearchPage from "./SearchClient";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-stone-500">Loading search…</p>}>
      <StoreSearchPage />
    </Suspense>
  );
}
