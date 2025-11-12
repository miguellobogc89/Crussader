// app/api/integrations/google/calendar/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  const redirectUri =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${baseUrl}/api/integrations/google/calendar/callback`;

  const returnTo =
    process.env.GOOGLE_CALENDAR_RETURN_URI ||
    `${baseUrl}/dashboard/integrations-test-2`;

  const companyId = url.searchParams.get("companyId") || null;
  const userId = (session?.user as any)?.id ?? null;
  const accountEmail = session?.user?.email ?? null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri
  );

  const scopes = [
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    "https://www.googleapis.com/auth/calendar.app.created",
    "https://www.googleapis.com/auth/calendar.freebusy",
  ];

  const state = JSON.stringify({
    redirect_after: returnTo,
    companyId,
    userId,
    accountEmail,
  });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
