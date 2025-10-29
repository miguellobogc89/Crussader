// app/dashboard/reviews/page.tsx
import { redirect } from "next/navigation";

export default function ReviewsIndex() {
  redirect("/dashboard/reviews/summary");
}
