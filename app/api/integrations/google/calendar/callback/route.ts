// app/api/integrations/google/calendar/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  let redirectAfter =
    process.env.GOOGLE_CALENDAR_RETURN_URI || `${baseUrl}/dashboard/calendar`;

  let companyId: string | null = null;
  let userId: string | null = null;
  let accountEmail: string | null = null;
  let locationId: string | null = null;

  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam);

      if (typeof parsed.redirect_after === "string") {
        redirectAfter = parsed.redirect_after;
      }

      if (typeof parsed.companyId === "string") {
        companyId = parsed.companyId;
      }

      if (typeof parsed.locationId === "string") {
        locationId = parsed.locationId;
      }

      if (typeof parsed.userId === "string") {
        userId = parsed.userId;
      }

      if (typeof parsed.accountEmail === "string") {
        accountEmail = parsed.accountEmail;
      }
    } catch {}
  }

  if (!code) {
    return NextResponse.redirect(`${redirectAfter}?error=missing_code`);
  }

  if (!userId) {
    return NextResponse.redirect(`${redirectAfter}?error=missing_user`);
  }

  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${baseUrl}/api/integrations/google/calendar/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri
  );

  try {
    const { tokens } = await client.getToken(code);

    client.setCredentials(tokens);

let googleAccountEmail: string | null = accountEmail;

try {
  const oauth2 = google.oauth2({
    version: "v2",
    auth: client,
  });

  const userInfo = await oauth2.userinfo.get();

  if (typeof userInfo.data.email === "string") {
    googleAccountEmail = userInfo.data.email;
  }
} catch (error) {
  console.error("[Calendar Callback] Could not fetch Google account email:", error);
}

    const accessToken =
      typeof tokens.access_token === "string" ? tokens.access_token : null;

    const refreshToken =
      typeof tokens.refresh_token === "string" ? tokens.refresh_token : null;

    const expiresAtSec =
      typeof tokens.expiry_date === "number"
        ? Math.floor(tokens.expiry_date / 1000)
        : null;

    const scopeStr = tokens.scope || null;
    const provider = "google-calendar" as const;

    if (!accessToken) {
      return NextResponse.redirect(`${redirectAfter}?error=missing_token`);
    }

    const existing = await prisma.externalConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (existing) {
      await prisma.externalConnection.update({
        where: {
          id: existing.id,
        },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: googleAccountEmail || undefined,
          status: "active",
        },
      });
    } else {
      await prisma.externalConnection.create({
        data: {
          userId,
          provider,
          access_token: accessToken,
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: googleAccountEmail || undefined,
          status: "active",
        },
      });
    }

    const savedConnection = await prisma.externalConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!savedConnection || !companyId || !locationId) {
      return NextResponse.redirect(`${redirectAfter}?connected=google_calendar`);
    }

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      expiry_date: tokens.expiry_date || undefined,
    });

    const calendarApi = google.calendar({
      version: "v3",
      auth: client,
    });

    const calendarList = await calendarApi.calendarList.list();

    const googleCalendars = calendarList.data.items || [];

    let crussaderCalendar = googleCalendars.find((item) => {
      return item.summary === "Crussader Calendar";
    });

    if (!crussaderCalendar) {
      const created = await calendarApi.calendars.insert({
        requestBody: {
          summary: "Crussader Calendar",
          timeZone: "Europe/Madrid",
        },
      });

      crussaderCalendar = {
        id: created.data.id!,
        summary: created.data.summary || "Crussader Calendar",
        timeZone: created.data.timeZone || "Europe/Madrid",
        accessRole: "owner",
        primary: false,
      };
    }

    const calendarsToSave = [
      ...googleCalendars.filter((calendar) => {
        return calendar.id && calendar.id !== crussaderCalendar?.id;
      }),
      crussaderCalendar,
    ];

    await Promise.all(
      calendarsToSave.map((calendar) => {
        const isCrussaderCalendar = calendar.id === crussaderCalendar?.id;

        return prisma.external_calendar.upsert({
          where: {
            connection_id_external_calendar_id: {
              connection_id: savedConnection.id,
              external_calendar_id: calendar.id!,
            },
          },
          update: {
            company_id: companyId,
            location_id: locationId,
            name: calendar.summary || "Calendario sin nombre",
            timezone: calendar.timeZone || "Europe/Madrid",
            purpose: isCrussaderCalendar
              ? "crussader_mirror"
              : "google_context",
            access_role: calendar.accessRole || null,
            is_primary: Boolean(calendar.primary),
            is_app_created: isCrussaderCalendar,
            active: true,
          },
          create: {
            id: crypto.randomUUID(),
            connection_id: savedConnection.id,
            company_id: companyId,
            location_id: locationId,
            provider,
            external_calendar_id: calendar.id!,
            name: calendar.summary || "Calendario sin nombre",
            timezone: calendar.timeZone || "Europe/Madrid",
            purpose: isCrussaderCalendar
              ? "crussader_mirror"
              : "google_context",
            access_role: calendar.accessRole || null,
            is_primary: Boolean(calendar.primary),
            is_app_created: isCrussaderCalendar,
            active: true,
          },
        });
      })
    );

    return NextResponse.redirect(`${redirectAfter}?connected=google_calendar`);
  } catch (err) {
    console.error("[Calendar Callback] Error:", err);
    return NextResponse.redirect(`${redirectAfter}?error=calendar_callback`);
  }
}