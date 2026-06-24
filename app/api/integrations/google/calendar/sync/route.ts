// app/api/integrations/google/calendar/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { AppointmentStatus } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB",
  "2": "#33B679",
  "3": "#8E24AA",
  "4": "#E67C73",
  "5": "#F6BF26",
  "6": "#F4511E",
  "7": "#039BE5",
  "8": "#616161",
  "9": "#3F51B5",
  "10": "#0B8043",
  "11": "#D50000",
};

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
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    let body: any = {};

try {
  body = await req.json();
} catch {
  body = {};
}

    const companyId = typeof body.companyId === "string" ? body.companyId : null;
    const locationId = typeof body.locationId === "string" ? body.locationId : null;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 }
      );
    }

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "missing_location_id" },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 }
      );
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
      },
    });

    if (!oauthConnection) {
      return NextResponse.json(
        { ok: false, error: "google_calendar_not_connected" },
        { status: 404 }
      );
    }

const savedCalendars = await prisma.external_calendar.findMany({
  where: {
    company_id: companyId,
    location_id: locationId,
    provider: "google-calendar",
    purpose: "google_context",
    active: true,
    external_calendar_id: {
      not: "",
    },
  },
  select: {
    id: true,
    external_calendar_id: true,
  },
});

const calendarIds = savedCalendars
  .map((calendar) => calendar.external_calendar_id)
  .filter((id): id is string => Boolean(id));

if (calendarIds.length === 0) {
  return NextResponse.json({
    ok: true,
    message: "no_google_calendars_configured",
    imported: 0,
  });
}

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    );

    client.setCredentials({
      access_token: oauthConnection.access_token || undefined,
      refresh_token: oauthConnection.refresh_token || undefined,
      expiry_date: oauthConnection.expires_at
        ? oauthConnection.expires_at * 1000
        : undefined,
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

const employees = await prisma.employee.findMany({
  where: {
    active: true,
    email: {
      not: null,
    },
    locations: {
      some: {
        locationId,
      },
    },
  },
  select: {
    id: true,
    email: true,
  },
});

    for (const calendarId of calendarIds) {
      const savedCalendar = savedCalendars.find((calendar) => {
  return calendar.external_calendar_id === calendarId;
});

if (!savedCalendar) {
  continue;
}

const configConnection = await prisma.external_calendar_connection.upsert({
  where: {
    id: savedCalendar.id,
  },
  update: {
    user_id: dbUser.id,
    company_id: companyId,
    provider: "google-calendar",
    external_account_email: dbUser.email,
    external_calendar_id: calendarId,
    external_calendar_name: null,
    sync_enabled: true,
    updated_at: new Date(),
  },
  create: {
    id: savedCalendar.id,
    user_id: dbUser.id,
    company_id: companyId,
    provider: "google-calendar",
    external_account_email: dbUser.email,
    external_calendar_id: calendarId,
    external_calendar_name: null,
    sync_enabled: true,
  },
});

const configConnectionId = configConnection.id;

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
      const googleEventIds = events
        .map((event) => event.id)
        .filter((id): id is string => typeof id === "string");

      importedByCalendar[calendarId] = 0;

      for (const event of events) {
        if (!event.id) continue;

        if (event.status === "cancelled") {
          await prisma.external_calendar_event.updateMany({
            where: {
              provider: "google-calendar",
              external_calendar_id: calendarId,
              external_event_id: event.id,
              company_id: companyId,
            },
            data: {
              status: "cancelled",
              updated_at: new Date(),
              raw_payload: event as any,
            },
          });

          await prisma.appointment.updateMany({
            where: {
              externalProvider: "google-calendar",
              externalCalendarId: calendarId,
              externalEventId: event.id,
              locationId,
            },
            data: {
              status: AppointmentStatus.CANCELLED,
              cancellation_reason: "Cancelado en Google Calendar",
            },
          });

          continue;
        }

        const startAt = getEventStart(event);
        const endAt = getEventEnd(event);

        if (!startAt || !endAt) continue;

        const attendees = Array.isArray(event.attendees) ? event.attendees : [];

const matchedEmployee = employees.find((employee) => {
  if (!employee.email) return false;

  return attendees.some((attendee: any) => {
    if (!attendee.email) return false;

    return attendee.email.toLowerCase() === employee.email!.toLowerCase();
  });
});

const employeeId = matchedEmployee?.id ?? null;

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

        const externalColor =
          typeof event.colorId === "string"
            ? GOOGLE_EVENT_COLORS[event.colorId] ?? "#4285F4"
            : "#4285F4";

        const existingAppointment = await prisma.appointment.findUnique({
          where: {
            externalProvider_externalCalendarId_externalEventId: {
              externalProvider: "google-calendar",
              externalCalendarId: calendarId,
              externalEventId: event.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingAppointment) {
          await prisma.appointment.update({
            where: {
              id: existingAppointment.id,
            },
            data: {
              startAt,
              endAt,
              externalColor,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.appointment.create({
            data: {
              locationId,
              employeeId,
              startAt,
              endAt,
              status: AppointmentStatus.BOOKED,
              customerName: event.summary || null,
              notes: event.description || null,
              serviceName: event.summary || "Evento Google",
              externalProvider: "google-calendar",
              externalCalendarId: calendarId,
              externalEventId: event.id,
              externalColor,
            },
          });
        }

        imported += 1;
        importedByCalendar[calendarId] += 1;
      }

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

      await prisma.appointment.updateMany({
        where: {
          externalProvider: "google-calendar",
          externalCalendarId: calendarId,
          locationId,
          startAt: { lt: new Date(timeMax) },
          endAt: { gt: new Date(timeMin) },
          status: { not: AppointmentStatus.CANCELLED },
          externalEventId: {
            notIn: googleEventIds,
          },
        },
        data: {
          status: AppointmentStatus.CANCELLED,
          cancellation_reason: "Eliminado o cancelado en Google Calendar",
        },
      });
    }

    await prisma.external_calendar_connection.updateMany({
      where: {
        company_id: companyId,
        provider: "google-calendar",
        sync_enabled: true,
      },
      data: {
        last_synced_at: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "google_calendar_events_synced",
      imported,
      importedByCalendar,
      range: {
        from: timeMin,
        to: timeMax,
      },
    });
  } catch (error: any) {
    console.error("[google.calendar.sync.POST]", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "internal_error" },
      { status: 500 }
    );
  }
}