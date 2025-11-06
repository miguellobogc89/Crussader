// app/api/integrations/google/reviews/connect/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
const REDIRECT_URI =
  process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/connect/google-business/callback`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId") ?? "";
  const returnTo = url.searchParams.get("returnTo") ?? "/dashboard/companies";

  // nonce para proteger state
  const nonce = crypto.randomBytes(16).toString("hex");

  // guardamos contexto (locationId/returnTo) en cookie separada
  const ctx = Buffer.from(JSON.stringify({ locationId, returnTo }), "utf8").toString("base64url");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    state: nonce, // sólo el nonce va en state
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  res.cookies.set("gb_state", nonce, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });

  // contexto para usarlo en el callback
  res.cookies.set("gb_ctx", ctx, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });

  return res;
}
