// app/api/integrations/google/calendar/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  let redirectAfter =
    process.env.GOOGLE_CALENDAR_RETURN_URI ||
    `${baseUrl}/dashboard/integrations-test-2`;

  let companyId: string | null = null;
  let userId: string | null = null;
  let accountEmail: string | null = null;

  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam);
      if (typeof parsed.redirect_after === "string") redirectAfter = parsed.redirect_after;
      if (typeof parsed.companyId === "string") companyId = parsed.companyId;
      if (typeof parsed.userId === "string") userId = parsed.userId;
      if (typeof parsed.accountEmail === "string") accountEmail = parsed.accountEmail;
    } catch {}
  }

  if (!code) return NextResponse.redirect(`${redirectAfter}?error=missing_code`);
  if (!userId) return NextResponse.redirect(`${redirectAfter}?error=missing_user`);

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

    const accessToken = typeof tokens.access_token === "string" ? tokens.access_token : null;
    const refreshToken = typeof tokens.refresh_token === "string" ? tokens.refresh_token : null;
    const expiresAtSec =
      typeof tokens.expiry_date === "number" ? Math.floor(tokens.expiry_date / 1000) : null;
    const scopeStr =
      Array.isArray((tokens as any).scope)
        ? (tokens as any).scope.join(" ")
        : typeof (tokens as any).scope === "string"
        ? (tokens as any).scope
        : null;

    const provider = "google-calendar" as const;

    const existing = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (existing) {
      await prisma.externalConnection.update({
        where: { id: existing.id },
        data: {
          access_token: accessToken!,                 // requerido por tu modelo
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: accountEmail || undefined,
        },
      });
    } else {
      await prisma.externalConnection.create({
        data: {
          userId,
          provider,
          access_token: accessToken!,                 // requerido por tu modelo
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: accountEmail || undefined,
        },
      });
    }

    return NextResponse.redirect(`${redirectAfter}?connected=google_calendar`);
  } catch (err) {
    console.error("[Calendar Callback] Error:", err);
    return NextResponse.redirect(`${redirectAfter}?error=calendar_callback`);
  }
}
