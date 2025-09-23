import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connections-test?error=missing_code`
    );
  }
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connections-test?error=not_authenticated`
    );
  }

  // id/email que vienen de la sesión
  const sessionUserId = (session.user as any).id as string;
  const sessionEmail = session.user.email ?? null;

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/calendar/callback`;
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri
  );

  try {
    // 1) Intercambia code -> tokens
    const tokenResp = await client.getToken(code);
    const tokens = tokenResp.tokens;
    client.setCredentials(tokens);

    // Normalización campos
    let accessToken: string | null = null;
    if (typeof tokens.access_token === "string" && tokens.access_token.length > 0) accessToken = tokens.access_token;

    let refreshToken: string | null = null;
    if (typeof tokens.refresh_token === "string" && tokens.refresh_token.length > 0) refreshToken = tokens.refresh_token;

    let expiresAtSec: number | null = null;
    if (typeof tokens.expiry_date === "number") expiresAtSec = Math.floor(tokens.expiry_date / 1000);

    let scopeStr: string | null = null;
    const rawScope: unknown = (tokens as any).scope;
    if (typeof rawScope === "string") scopeStr = rawScope;
    else if (Array.isArray(rawScope)) scopeStr = rawScope.join(" ");

    // Info de la cuenta Google conectada (opcional)
    let accountEmail: string | null = null;
    let providerUserId: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: client });
      const me = await oauth2.userinfo.get();
      if (typeof me.data.email === "string") accountEmail = me.data.email;
      if (typeof me.data.id === "string") providerUserId = me.data.id;
    } catch {
      /* opcional */
    }

    // 2) Resolver User en DB de forma robusta:
    //    a) por id de sesión
    //    b) si no existe, por email de sesión
    //    c) si tampoco, crear uno nuevo (sin forzar id para evitar colisiones)
    let dbUser = await prisma.user.findUnique({ where: { id: sessionUserId } });

    if (!dbUser && typeof sessionEmail === "string") {
      const byEmail = await prisma.user.findUnique({ where: { email: sessionEmail } });
      if (byEmail) {
        dbUser = byEmail;
      }
    }

    if (!dbUser) {
      // Creamos nuevo user con lo que tengamos de la sesión
      dbUser = await prisma.user.create({
        data: {
          email: sessionEmail || undefined,
          name: session.user.name || null,
          role: "user",
          emailVerified: new Date(),
        },
      });
    }

    const ownerUserId = dbUser.id; // ← ESTE es el id válido que respeta la FK

    // 3) Upsert de ExternalConnection por unique (userId, provider)
    const provider = "GOOGLE_CALENDAR" as const;

    const existing = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId: ownerUserId, provider } },
    });

    if (existing) {
      const updateData: any = {};
      if (accountEmail !== null) updateData.accountEmail = accountEmail;
      if (providerUserId !== null) updateData.providerUserId = providerUserId;
      if (typeof accessToken === "string") updateData.access_token = accessToken;
      if (typeof refreshToken === "string" && refreshToken.length > 0) updateData.refresh_token = refreshToken;
      if (typeof expiresAtSec === "number") updateData.expires_at = expiresAtSec;
      if (typeof scopeStr === "string") updateData.scope = scopeStr;

      await prisma.externalConnection.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      const createData: any = {
        userId: ownerUserId,
        provider,
      };
      if (typeof accessToken === "string") createData.access_token = accessToken;
      if (typeof refreshToken === "string") createData.refresh_token = refreshToken;
      if (typeof expiresAtSec === "number") createData.expires_at = expiresAtSec;
      if (typeof scopeStr === "string") createData.scope = scopeStr;
      if (typeof accountEmail === "string") createData.accountEmail = accountEmail;
      if (typeof providerUserId === "string") createData.providerUserId = providerUserId;

      await prisma.externalConnection.create({ data: createData });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connections-test?connected=google_calendar`
    );
  } catch (err: any) {
    console.error("[Calendar Callback] Error:", err);
    return NextResponse.json(
      { ok: false, error: "calendar_callback", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
