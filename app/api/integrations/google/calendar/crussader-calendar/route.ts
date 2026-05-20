// app/api/integrations/google/calendar/crussader-calendar/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 }
    );
  }

  const connection = await prisma.externalConnection.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: "google-calendar",
      },
    },
  });

  if (!connection?.access_token || !connection?.refresh_token) {
    return NextResponse.json(
      { ok: false, error: "Google Calendar no está conectado" },
      { status: 400 }
    );
  }

  const existingCalendar = await prisma.external_calendar.findFirst({
    where: {
      company_id: connection.companyId,
      provider: "google-calendar",
      purpose: "slot_recovery",
      active: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (existingCalendar) {
    return NextResponse.json({
      ok: true,
      existing: true,
      calendar: {
        id: existingCalendar.external_calendar_id,
        summary: existingCalendar.name,
        timeZone: existingCalendar.timezone,
      },
    });
  }

  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/calendar/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri
  );

  client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.expires_at ? connection.expires_at * 1000 : undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const created = await calendar.calendars.insert({
    requestBody: {
      summary: "Crussader - Citas recuperadas",
      timeZone: "Europe/Madrid",
    },
  });

  await prisma.external_calendar.create({
    data: {
      id: crypto.randomUUID(),
      connection_id: connection.id,
      company_id: connection.companyId,
      provider: "google-calendar",
      external_calendar_id: created.data.id!,
      name: created.data.summary || "Crussader - Citas recuperadas",
      timezone: created.data.timeZone || "Europe/Madrid",
      purpose: "slot_recovery",
      access_role: "owner",
      is_primary: false,
      is_app_created: true,
      active: true,
    },
  });

  return NextResponse.json({
    ok: true,
    existing: false,
    calendar: {
      id: created.data.id,
      summary: created.data.summary,
      timeZone: created.data.timeZone,
    },
  });
}