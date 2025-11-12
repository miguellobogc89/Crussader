import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  let redirectAfter =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations-test-2`;

  let companyId: string | null = null;
  let userId: string | null = null;
  let accountEmail: string | null = null;

  // ✅ Leer los datos enviados desde connect
  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam);
      if (parsed.redirect_after) redirectAfter = parsed.redirect_after;
      if (parsed.companyId) companyId = parsed.companyId;
      if (parsed.userId) userId = parsed.userId;
      if (parsed.accountEmail) accountEmail = parsed.accountEmail;
    } catch {
      // ignorar errores
    }
  }

  if (!code) {
    return NextResponse.redirect(`${redirectAfter}?error=missing_code`);
  }

  if (!userId) {
    console.error("[Google Business Callback] Missing userId in state");
    return NextResponse.redirect(`${redirectAfter}?error=missing_user`);
  }

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

    const accessToken = tokens.access_token ?? null;
    const refreshToken = tokens.refresh_token ?? null;
    const expiresAtSec = tokens.expiry_date
      ? Math.floor(tokens.expiry_date / 1000)
      : null;
    const scopeStr = Array.isArray(tokens.scope)
      ? tokens.scope.join(" ")
      : typeof tokens.scope === "string"
      ? tokens.scope
      : null;

    const provider = "google-business" as const;

    // 🔹 Crear o actualizar ExternalConnection directamente con los datos recibidos
    const existing = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    if (existing) {
      const updateData: any = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAtSec,
        scope: scopeStr,
      };
      if (companyId) updateData.companyId = companyId;
      if (accountEmail) updateData.accountEmail = accountEmail;
      await prisma.externalConnection.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.externalConnection.create({
        data: {
          userId,
          provider,
          access_token: accessToken!,
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: accountEmail || undefined,
        },
      });
    }

    return NextResponse.redirect(`${redirectAfter}?connected=google_business`);
  } catch (err) {
    console.error("[Google Business Callback] Error:", err);
    return NextResponse.redirect(`${redirectAfter}?error=google_business_callback`);
  }
}
