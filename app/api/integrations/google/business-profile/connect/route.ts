import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const redirectUri =
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

  const returnTo =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations-test-2`;

  const companyId = url.searchParams.get("companyId") || null;
  const userId = (session?.user as any)?.id ?? null;
  const accountEmail = session?.user?.email ?? null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    redirectUri
  );

  // Scopes: básicos + Google Business Profile
  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/business.manage",
  ];

  // ⬇️ Enviamos datos completos en el state
  const state = JSON.stringify({
    redirect_after: returnTo,
    companyId,
    userId,
    accountEmail,
  });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
