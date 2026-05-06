// app/api/integrations/google/calendar/calendars/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const connection = await prisma.externalConnection.findFirst({
    where: {
      userId: dbUser.id,
      provider: "google-calendar",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!connection) {
    return NextResponse.json({ ok: false, error: "google_calendar_not_connected" }, { status: 404 });
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  );

  client.setCredentials({
    access_token: connection.access_token || undefined,
    refresh_token: connection.refresh_token || undefined,
    expiry_date: connection.expires_at ? connection.expires_at * 1000 : undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const calendarList = await calendar.calendarList.list();

  return NextResponse.json({
    ok: true,
    connectionId: connection.id,
    calendars:
      calendarList.data.items?.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description || null,
        primary: cal.primary || false,
        accessRole: cal.accessRole,
        backgroundColor: cal.backgroundColor || null,
      })) || [],
  });
}