import { redirect } from "next/navigation";

export default function ReviewsIndex() {
  redirect("/dashboard/reviews/summary");
}
