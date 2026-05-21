// app/api/integrations/google/calendar/events/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  summary?: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Body;

    const summary = body.summary?.trim();
    const startAt = body.startAt?.trim();
    const endAt = body.endAt?.trim();
    const timezone = body.timezone?.trim() || "Europe/Madrid";

    if (!summary || !startAt || !endAt) {
      return NextResponse.json(
        {
          ok: false,
          error: "Faltan summary, startAt o endAt",
        },
        { status: 400 }
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
  expiry_date: connection.expires_at
    ? connection.expires_at * 1000
    : undefined,
});

    const calendar = google.calendar({
      version: "v3",
      auth: client,
    });

    const storedCalendar = await prisma.external_calendar.findFirst({
  where: {
    connection_id: connection.id,
    purpose: "slot_recovery",
    active: true,
  },
});

if (!storedCalendar) {
  return NextResponse.json(
    { ok: false, error: "No existe calendario Crussader configurado" },
    { status: 400 }
  );
}

    const created = await calendar.events.insert({
        calendarId: storedCalendar.external_calendar_id,
      requestBody: {
        summary,
        description: body.description || undefined,
        location: body.location || undefined,
        start: {
          dateTime: startAt,
          timeZone: timezone,
        },
        end: {
          dateTime: endAt,
          timeZone: timezone,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      event: {
        id: created.data.id,
        htmlLink: created.data.htmlLink,
        summary: created.data.summary,
        start: created.data.start,
        end: created.data.end,
      },
    });
  } catch (error: any) {
    console.error("[GOOGLE CALENDAR EVENT CREATE ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Error creando evento en Google Calendar",
      },
      { status: 500 }
    );
  }
}