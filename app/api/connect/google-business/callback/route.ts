import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Usa credenciales específicas para la conexión "Google Business"
const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_BUSINESS_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_BUSINESS_REDIRECT_URI!; // p.ej. http://localhost:3000/api/connect/google-business/callback

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) return NextResponse.redirect(new URL("/dashboard?connected=fail_missing_code", req.url));
  if (!state) return NextResponse.redirect(new URL("/dashboard?connected=fail_missing_state", req.url));

  // (Opcional) verifica el state con cookie si tu flujo lo guarda:
  // const cookieState = req.cookies.get("connect_state")?.value;
  // if (!cookieState || cookieState !== state) {
  //   return NextResponse.redirect(new URL("/dashboard?connected=fail_bad_state", req.url));
  // }

  // Debe existir sesión (usuario logueado)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/auth?tab=login&error=not_authenticated", req.url));
  }

  // Intercambio de code -> tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/dashboard?connected=fail_token", req.url));
  }
  const tokenJson: {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    id_token?: string;
  } = await tokenRes.json();

  const expires_at = tokenJson.expires_in ? Math.floor(Date.now() / 1000) + tokenJson.expires_in : null;

  // Obtener email de la cuenta para mostrar en el badge
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : {};
  const accountEmail = typeof profile?.email === "string" ? profile.email : null;

  // Resolver userId por email de la sesión
  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!dbUser) {
    return NextResponse.redirect(new URL("/dashboard?connected=fail_user", req.url));
  }

  // Guardar/actualizar conexión externa
  await prisma.externalConnection.upsert({
    where: { userId_provider: { userId: dbUser.id, provider: "google-business" } },
    update: {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token ?? null,
      expires_at: expires_at ?? null,
      accountEmail,
    },
    create: {
      userId: dbUser.id,
      provider: "google-business",
      accountEmail,
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token ?? null,
      expires_at: expires_at ?? null,
    },
  });

  // Redirigir al dashboard con flag para pintar el badge en verde
  return NextResponse.redirect(new URL("/dashboard?connected=google-business", req.url));
}
