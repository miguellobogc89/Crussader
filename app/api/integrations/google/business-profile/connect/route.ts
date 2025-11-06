// app/api/integrations/google/business-profile/connect/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

// Scopes mínimos para Business Profile (gestión/lectura)
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
].join(" ");

export async function GET(req: NextRequest) {
  // ✅ Usamos las MISMAS envs que tu callback antiguo
  const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
  const REDIRECT_ENV = process.env.GOOGLE_BUSINESS_REDIRECT_URI;
  if (!CLIENT_ID) {
    return new NextResponse("Missing GOOGLE_BUSINESS_CLIENT_ID", { status: 500 });
  }

  // Si tienes la redirect fija en Google Console, respétala; si no, fallback al path nuevo
  const origin = req.nextUrl.origin;
  const REDIRECT_URI =
    REDIRECT_ENV || `${origin}/api/integrations/google/business-profile/callback`;

  // Parámetros opcionales de contexto
  const returnTo =
    req.nextUrl.searchParams.get("returnTo") || "/dashboard/integrations-test-2";
  const locationId = req.nextUrl.searchParams.get("locationId") || "";

  // CSRF/state (en prod fírmalo)
  const state = Math.random().toString(36).slice(2);

  // Guardamos contexto en cookie base64url EXACTAMENTE como espera tu callback (gb_ctx + gb_state)
  const ctx = {
    returnTo,
    locationId,
  };
  const ctxB64 = Buffer.from(JSON.stringify(ctx), "utf8").toString("base64url");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  const res = NextResponse.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  res.cookies.set("gb_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  res.cookies.set("gb_ctx", ctxB64, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
