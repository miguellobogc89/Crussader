// app/api/integrations/google/calendar/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getEventStart(event: any): Date | null {
  const value = event.start?.dateTime || event.start?.date;
  if (!value) return null;
  return new Date(value);
}

function getEventEnd(event: any): Date | null {
  const value = event.end?.dateTime || event.end?.date;
  if (!value) return null;
  return new Date(value);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json();

  const companyId = typeof body.companyId === "string" ? body.companyId : null;
  const locationId = typeof body.locationId === "string" ? body.locationId : null;
  const selectedCalendarIds = Array.isArray(body.selectedCalendarIds)
    ? body.selectedCalendarIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "missing_company_id" }, { status: 400 });
  }

  if (selectedCalendarIds.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_selected_calendar_ids" }, { status: 400 });
  }

  await prisma.external_calendar_connection.updateMany({
  where: {
    company_id: companyId,
    provider: "google-calendar",
  },
  data: {
    external_calendar_id: selectedCalendarIds.join(","),
    last_synced_at: new Date(),
  },
});

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });

  if (!dbUser) {
    return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });
  }

  const oauthConnection = await prisma.externalConnection.findFirst({
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
      accountEmail: true,
    },
  });

  if (!oauthConnection) {
    return NextResponse.json({ ok: false, error: "google_calendar_not_connected" }, { status: 404 });
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  );

  client.setCredentials({
    access_token: oauthConnection.access_token || undefined,
    refresh_token: oauthConnection.refresh_token || undefined,
    expiry_date: oauthConnection.expires_at ? oauthConnection.expires_at * 1000 : undefined,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: client,
  });

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = addDays(now, 90).toISOString();

  let imported = 0;
  const importedByCalendar: Record<string, number> = {};

  for (const calendarId of selectedCalendarIds) {
    const configConnectionId = crypto.randomUUID();

    await prisma.external_calendar_connection.upsert({
      where: { id: configConnectionId },
      update: {},
      create: {
        id: configConnectionId,
        user_id: dbUser.id,
        company_id: companyId,
        provider: "google-calendar",
        external_account_email: oauthConnection.accountEmail || session.user.email,
      },
    });

const eventsResult = await calendar.events.list({
  calendarId,
  singleEvents: true,
  orderBy: "startTime",
  timeMin,
  timeMax,
  maxResults: 250,
  showDeleted: true,
});

    const events = eventsResult.data.items || [];
    importedByCalendar[calendarId] = 0;

    for (const event of events) {
      if (!event.id) continue;

      if (event.status === "cancelled") {
const googleEventIds = events
  .map((event) => event.id)
  .filter((id): id is string => typeof id === "string");

await prisma.external_calendar_event.updateMany({
  where: {
    provider: "google-calendar",
    external_calendar_id: calendarId,
    company_id: companyId,
    start_at: { lt: new Date(timeMax) },
    end_at: { gt: new Date(timeMin) },
    status: { not: "cancelled" },
    external_event_id: {
      notIn: googleEventIds,
    },
  },
  data: {
    status: "cancelled",
    updated_at: new Date(),
  },
});

  continue;
}

      const startAt = getEventStart(event);
      const endAt = getEventEnd(event);

      if (!startAt || !endAt) continue;

      await prisma.external_calendar_event.upsert({
        where: {
          provider_external_event_id_external_calendar_id: {
            provider: "google-calendar",
            external_event_id: event.id,
            external_calendar_id: calendarId,
          },
        },
        update: {
          connection_id: configConnectionId,
          company_id: companyId,
          location_id: locationId,
          title: event.summary || "Evento sin título",
          description: event.description || null,
          start_at: startAt,
          end_at: endAt,
          timezone: event.start?.timeZone || event.end?.timeZone || null,
          status: event.status || null,
          raw_payload: event as any,
          updated_at: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          connection_id: configConnectionId,
          company_id: companyId,
          location_id: locationId,
          provider: "google-calendar",
          external_calendar_id: calendarId,
          external_event_id: event.id,
          title: event.summary || "Evento sin título",
          description: event.description || null,
          start_at: startAt,
          end_at: endAt,
          timezone: event.start?.timeZone || event.end?.timeZone || null,
          status: event.status || null,
          raw_payload: event as any,
        },
      });

      imported += 1;
      importedByCalendar[calendarId] += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    message: "google_calendar_events_imported",
    imported,
    importedByCalendar,
    range: {
      from: timeMin,
      to: timeMax,
    },
  });
}