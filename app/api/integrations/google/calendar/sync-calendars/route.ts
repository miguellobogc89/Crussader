// app/api/integrations/google/calendar/sync-calendars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const companyId = typeof body.companyId === "string" ? body.companyId : null;
  const locationId = typeof body.locationId === "string" ? body.locationId : null;

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "missing_company_id" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true,},
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const connection = await prisma.externalConnection.findUnique({
    where: {
      userId_provider: {
        userId: dbUser.id,
        provider: "google-calendar",
      },
    },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      accountEmail: true,
    },
  });

  if (!connection) {
    return NextResponse.json({ ok: false, error: "google_calendar_not_connected" }, { status: 404 });
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!
  );

  client.setCredentials({
    access_token: connection.access_token || undefined,
    refresh_token: connection.refresh_token || undefined,
    expiry_date: connection.expires_at ? connection.expires_at * 1000 : undefined,
  });

  const calendarApi = google.calendar({
    version: "v3",
    auth: client,
  });

  const calendarList = await calendarApi.calendarList.list({
    showHidden: true,
    maxResults: 250,
});
  const googleCalendars = calendarList.data.items || [];

  console.log(
  "[sync-calendars] Google calendars:",
  googleCalendars.map((calendar) => {
    return {
      id: calendar.id,
      summary: calendar.summary,
      summaryOverride: calendar.summaryOverride,
      primary: calendar.primary,
      accessRole: calendar.accessRole,
      hidden: calendar.hidden,
      selected: calendar.selected,
    };
  })
);

  let created = 0;
  let updated = 0;

  for (const calendar of googleCalendars) {
    if (!calendar.id) {
      continue;
    }

    const isCrussaderCalendar = calendar.summary === "Crussader Calendar";

    const existing = await prisma.external_calendar.findUnique({
      where: {
        connection_id_external_calendar_id: {
          connection_id: connection.id,
          external_calendar_id: calendar.id,
        },
      },
      select: { id: true },
    });

    await prisma.external_calendar.upsert({
      where: {
        connection_id_external_calendar_id: {
          connection_id: connection.id,
          external_calendar_id: calendar.id,
        },
      },
        update: {
        company_id: companyId,
        location_id: locationId,
        name: calendar.summary || "Calendario sin nombre",
        timezone: calendar.timeZone || "Europe/Madrid",
        purpose: isCrussaderCalendar ? "crussader_mirror" : "google_context",
        access_role: calendar.accessRole || null,
        is_primary: Boolean(calendar.primary),
        is_app_created: isCrussaderCalendar,
        active: true,
        background_color: calendar.backgroundColor || null,
        foreground_color: calendar.foregroundColor || null,
        color_id: calendar.colorId || null,
        updated_at: new Date(),
        },
create: {
  id: crypto.randomUUID(),
  connection_id: connection.id,
  company_id: companyId,
  location_id: locationId,
  provider: "google-calendar",
  external_calendar_id: calendar.id,
  name: calendar.summary || "Calendario sin nombre",
  timezone: calendar.timeZone || "Europe/Madrid",
  purpose: isCrussaderCalendar ? "crussader_mirror" : "google_context",
  access_role: calendar.accessRole || null,
  is_primary: Boolean(calendar.primary),
  is_app_created: isCrussaderCalendar,
  active: true,
  background_color: calendar.backgroundColor || null,
  foreground_color: calendar.foregroundColor || null,
  color_id: calendar.colorId || null,
},
    });

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    total: googleCalendars.length,
  });
}