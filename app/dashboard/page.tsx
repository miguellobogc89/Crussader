// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getBootstrapData } from "@/lib/bootstrap";

export default async function DashboardIndex() {
  const initial = await getBootstrapData();
  const st = initial?.user?.onboardingStatus ?? "PENDING";
  if (st !== "COMPLETED") redirect("/dashboard/onboarding");
  redirect("/dashboard/home");
}
