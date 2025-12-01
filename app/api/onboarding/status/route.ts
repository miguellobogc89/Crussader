// app/api/onboarding/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { onboardingStatus: true },
  });

  return NextResponse.json({
    ok: true,
    onboardingStatus: me?.onboardingStatus ?? null,
  });
}
