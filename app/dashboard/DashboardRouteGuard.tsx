// app/dashboard/DashboardRouteGuard.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBootstrapData, useBootstrapStatus } from "@/app/providers/bootstrap-store";

function extractOnboardingStatus(data: any, session: any) {
  const d = data ?? {};
  return (
    d.me?.onboardingStatus ??
    d.user?.onboardingStatus ??
    d.currentUser?.onboardingStatus ??
    session?.user?.onboardingStatus ??
    (session?.user as any)?.onboarding_status ??
    null
  );
}

export default function DashboardRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const data = useBootstrapData();
  const status = useBootstrapStatus();
  const { data: session } = useSession();

  useEffect(() => {
    if (status !== "ready") return;

    const st = extractOnboardingStatus(data, session) || "PENDING";
    const isOnboarding = pathname?.startsWith("/dashboard/onboarding");

    if ((st === "PENDING" || st === "IN_PROGRESS") && !isOnboarding) {
      router.replace("/dashboard/onboarding");
      return;
    }
    if (st === "COMPLETED" && isOnboarding) {
      router.replace("/dashboard/home");
      return;
    }
  }, [status, data, session, pathname, router]);

  return null;
}
