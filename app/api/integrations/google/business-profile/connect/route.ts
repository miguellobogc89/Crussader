// app/api/integrations/google/business-profile/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const redirectUri =
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

  const returnTo =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations-test-2`;

  const companyId = url.searchParams.get("companyId") || null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    redirectUri
  );

  // 🔹 SCOPES DE PRUEBA — no sensibles
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  "https://www.googleapis.com/auth/business.manage",
  ];

  const state = JSON.stringify({
    redirect_after: returnTo,
    companyId,
  });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
