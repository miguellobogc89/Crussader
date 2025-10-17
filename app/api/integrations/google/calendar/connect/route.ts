import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(_req: NextRequest) {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/calendar/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri
  );

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "email",
      "profile",
    ],
  });

  return NextResponse.redirect(authUrl);
}
