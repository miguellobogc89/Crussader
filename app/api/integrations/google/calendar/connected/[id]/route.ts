// app/api/integrations/google/calendar/connected/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "missing_calendar_connection_id" },
      { status: 400 },
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

  const calendarConnection = await prisma.external_calendar_connection.findFirst({
    where: {
      id,
      user_id: dbUser.id,
      provider: "google-calendar",
    },
    select: {
      id: true,
    },
  });

  if (!calendarConnection) {
    return NextResponse.json(
      { ok: false, error: "calendar_connection_not_found" },
      { status: 404 },
    );
  }

  await prisma.external_calendar_connection.update({
    where: { id },
    data: {
      sync_enabled: false,
      updated_at: new Date(),
    },
  });

  await prisma.external_calendar_event.deleteMany({
    where: {
      connection_id: id,
      provider: "google-calendar",
    },
  });

  return NextResponse.json({
    ok: true,
  });
}