// app/api/integrations/google/calendar/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, connected: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { ok: false, connected: false, error: "user_not_found" },
      { status: 404 },
    );
  }

  const connection = await prisma.externalConnection.findFirst({
    where: {
      userId: dbUser.id,
      provider: "google-calendar",
      status: "active",
    },
    select: {
      id: true,
      accountEmail: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    connected: Boolean(connection),
    connection,
  });
}