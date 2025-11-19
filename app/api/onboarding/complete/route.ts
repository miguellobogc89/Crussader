// app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "NO_SESSION" },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: "COMPLETED", // 👈 usamos el campo existente
    },
  });

  return NextResponse.json({ ok: true });
}
