// app/api/integrations/google/business-profile/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/* ─────────────────────────────
   Helpers
   ───────────────────────────── */
async function getUserIdFromSession() {
  const jar = await cookies();
  const sessionToken =
    jar.get("__Secure-next-auth.session-token")?.value ??
    jar.get("next-auth.session-token")?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findFirst({
    where: { sessionToken },
    select: { userId: true },
  });

  return session?.userId ?? null;
}

/* ─────────────────────────────
   Callback principal
   ───────────────────────────── */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard/integrations-test-2?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return new NextResponse("Missing OAuth code", { status: 400 });
  }

  const userId = await getUserIdFromSession();
  if (!userId) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  if (!clientId || !clientSecret) {
    return new NextResponse("Missing Google OAuth credentials", { status: 500 });
  }

  const redirectUri = `${origin}/api/integrations/google/business-profile/callback`;

  // 1) Intercambiar el code por tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return new NextResponse(`Token exchange failed: ${txt}`, { status: 400 });
  }

  const tokenJson = await tokenRes.json();
  const accessToken: string = tokenJson.access_token;
  const refreshToken: string | null = tokenJson.refresh_token ?? null;
  const expiresIn: number = tokenJson.expires_in ?? 0;
  const scope: string | null = tokenJson.scope ?? null;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  // 2) Obtener userinfo básico
  let email: string | null = null;
  let name: string | null = null;
  let sub: string | null = null;

  const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (userinfoRes.ok) {
    const u = await userinfoRes.json();
    email = u.email ?? null;
    name = u.name ?? null;
    sub = u.sub ?? null;
  }

  // 3) Guardar/actualizar ExternalConnection
  await prisma.externalConnection.upsert({
    where: {
      userId_provider: {
        userId,
        provider: "google-business-profile",
      },
    },
    update: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scope,
      accountEmail: email,
      accountName: name,
      providerUserId: sub,
    },
    create: {
      userId,
      provider: "google-business-profile",
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scope,
      accountEmail: email,
      accountName: name,
      providerUserId: sub,
    },
  });

  // 4) Redirigir al dashboard
  return NextResponse.redirect(
    `${origin}/dashboard/integrations-test-2?connected=google-business-profile`
  );
}
