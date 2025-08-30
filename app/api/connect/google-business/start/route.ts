//app/api/connect/start/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/google-business/callback`,
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set("gb_state", state, { httpOnly: true, path: "/", maxAge: 600 });
  return res;
}
