// app/reviews-test/page.tsx
import { Suspense } from "react";
import ReviewsTestClient from "./ReviewsTestClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReviewsTestPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <ReviewsTestClient />
    </Suspense>
  );
}
