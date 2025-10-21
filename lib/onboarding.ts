// lib/onboarding.ts
import { prisma } from "@/lib/prisma";

export async function ensureOnboardingRedirect(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingStatus: true },
  });

  if (!user) return "/auth";
  if (user.onboardingStatus === "COMPLETED") return "/dashboard/home";
  return "/dashboard/onboarding";
}
