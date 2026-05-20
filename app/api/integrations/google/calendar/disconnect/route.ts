// app/api/integrations/google/calendar/disconnect/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: "user_not_found" },
      { status: 404 },
    );
  }

await prisma.$transaction([
  prisma.external_calendar_connection.updateMany({
    where: {
      user_id: dbUser.id,
      provider: "google-calendar",
    },
    data: {
      sync_enabled: false,
    },
  }),

  prisma.externalConnection.updateMany({
    where: {
      userId: dbUser.id,
      provider: "google-calendar",
    },
    data: {
      status: "disconnected",
    },
  }),
]);

  return NextResponse.json({
    ok: true,
  });
}