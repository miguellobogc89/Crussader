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

  const connection = await prisma.externalConnection.findFirst({
    where: {
      userId: dbUser.id,
      provider: "google-calendar",
    },
    select: { id: true },
  });

  if (!connection) {
    return NextResponse.json({
      ok: true,
      message: "not_connected",
    });
  }

  await prisma.$transaction([
    prisma.external_calendar_connection.updateMany({
      where: {
        user_id: dbUser.id,
        provider: "google-calendar",
      },
      data: {
        sync_enabled: false,
        updated_at: new Date(),
      },
    }),

    prisma.external_calendar.updateMany({
      where: {
        connection_id: connection.id,
        provider: "google-calendar",
        purpose: "google_context",
      },
      data: {
        active: false,
        updated_at: new Date(),
      },
    }),

    prisma.appointment.updateMany({
      where: {
        externalProvider: "google-calendar",
        externalCalendarId: {
          not: null,
        },
      },
      data: {
        status: "CANCELLED",
        cancellation_reason: "Desconectado de Google Calendar",
        updated_at: new Date(),
      },
    }),

    prisma.externalConnection.updateMany({
      where: {
        userId: dbUser.id,
        provider: "google-calendar",
      },
      data: {
        status: "disconnected",
        updatedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    message: "google_calendar_disconnected",
  });
}