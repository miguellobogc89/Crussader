// app/api/integrations/google/business-profile/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  let redirectAfter =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations-test-2`;

  let companyId: string | null = null;

  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam);
      if (parsed && typeof parsed.redirect_after === "string") {
        redirectAfter = parsed.redirect_after.startsWith("http")
          ? parsed.redirect_after
          : `${process.env.NEXT_PUBLIC_APP_URL}${parsed.redirect_after}`;
      }
      if (parsed && typeof parsed.companyId === "string") {
        companyId = parsed.companyId;
      }
    } catch {
      // ignore
    }
  }

  if (!code) {
    return NextResponse.redirect(`${redirectAfter}?error=missing_code`);
  }

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.redirect(`${redirectAfter}?error=not_authenticated`);
  }

  const sessionUserId = (session.user as any).id as string;
  const sessionEmail = session.user.email ?? null;

  const redirectUri =
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    redirectUri
  );

  try {
    const tokenResp = await client.getToken(code);
    const tokens = tokenResp.tokens;
    client.setCredentials(tokens);

    let accessToken: string | null = null;
    if (typeof tokens.access_token === "string" && tokens.access_token.length > 0) {
      accessToken = tokens.access_token;
    }

    let refreshToken: string | null = null;
    if (typeof tokens.refresh_token === "string" && tokens.refresh_token.length > 0) {
      refreshToken = tokens.refresh_token;
    }

    let expiresAtSec: number | null = null;
    if (typeof tokens.expiry_date === "number") {
      expiresAtSec = Math.floor(tokens.expiry_date / 1000);
    }

    let scopeStr: string | null = null;
    const rawScope: unknown = (tokens as any).scope;
    if (typeof rawScope === "string") scopeStr = rawScope;
    else if (Array.isArray(rawScope)) scopeStr = rawScope.join(" ");

    // Resolver user
    let dbUser = await prisma.user.findUnique({ where: { id: sessionUserId } });

    if (!dbUser && typeof sessionEmail === "string") {
      const byEmail = await prisma.user.findUnique({ where: { email: sessionEmail } });
      if (byEmail) dbUser = byEmail;
    }

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: sessionEmail || undefined,
          name: session.user.name || null,
          role: "user",
          emailVerified: new Date(),
        },
      });
    }

    const ownerUserId = dbUser.id;
    const provider = "google-business" as const;
    const accountEmail = sessionEmail || null;

    // upsert ExternalConnection con companyId
    const existing = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId: ownerUserId, provider } },
    });

    if (existing) {
      const updateData: any = {};
      if (accountEmail !== null) updateData.accountEmail = accountEmail;
      if (typeof accessToken === "string") updateData.access_token = accessToken;
      if (typeof refreshToken === "string") updateData.refresh_token = refreshToken;
      if (typeof expiresAtSec === "number") updateData.expires_at = expiresAtSec;
      if (typeof scopeStr === "string") updateData.scope = scopeStr;
      if (companyId) updateData.companyId = companyId;

      await prisma.externalConnection.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      const createData: any = {
        userId: ownerUserId,
        provider,
      };
      if (companyId) createData.companyId = companyId;
      if (typeof accessToken === "string") createData.access_token = accessToken;
      if (typeof refreshToken === "string") createData.refresh_token = refreshToken;
      if (typeof expiresAtSec === "number") createData.expires_at = expiresAtSec;
      if (typeof scopeStr === "string") createData.scope = scopeStr;
      if (accountEmail !== null) createData.accountEmail = accountEmail;

      await prisma.externalConnection.create({ data: createData });
    }

    return NextResponse.redirect(`${redirectAfter}?connected=google_business`);
  } catch (err) {
    console.error("[Google Business Callback] Error:", err);
    return NextResponse.redirect(`${redirectAfter}?error=google_business_callback`);
  }
}
