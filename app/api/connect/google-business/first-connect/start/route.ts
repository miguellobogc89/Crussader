import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

// IMPORTANTE: usa SIEMPRE este callback (first-connect) para evitar mismatch.
const REDIRECT_URI =
  process.env.GOOGLE_BUSINESS_FIRST_CONNECT_REDIRECT_URI ||
  `${APP_URL}/api/connect/google-business/first-connect/callback`;

export async function GET() {
  const nonce = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    state: nonce,
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

  return res;
}
