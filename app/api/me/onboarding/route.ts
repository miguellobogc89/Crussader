// app/api/users/me/onboarding/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { status } = await req.json(); // "IN_PROGRESS" | "COMPLETED"

  if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "INVALID_STATUS" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { onboardingStatus: status },
    select: { id: true, onboardingStatus: true },
  });

  const res = NextResponse.json({ ok: true, user });
  // 👇 evita que el navegador/Next cachee la respuesta
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res;
}
