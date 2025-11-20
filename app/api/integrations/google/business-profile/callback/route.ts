// app/api/integrations/google/business-profile/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Fallback por si no hubiera state o no trajera redirect_after
  let redirectAfter =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${appUrl}/dashboard/mybusiness`;

  let companyId: string | null = null;
  let userId: string | null = null;
  let accountEmail: string | null = null;

  // Leer los datos enviados desde connect
  if (stateParam) {
    try {
      const parsed = JSON.parse(stateParam);
      if (
        parsed &&
        typeof parsed.redirect_after === "string" &&
        parsed.redirect_after.trim().length > 0
      ) {
        redirectAfter = parsed.redirect_after;
      }
      if (parsed.companyId) companyId = parsed.companyId;
      if (parsed.userId) userId = parsed.userId;
      if (parsed.accountEmail) accountEmail = parsed.accountEmail;
    } catch {
      // ignorar errores de parseo, usamos el fallback
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
    `${appUrl}/api/integrations/google/business-profile/callback`;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    redirectUri,
  );

  try {
    // 1) Intercambiar code -> tokens
    const tokenResp = await client.getToken(code);
    const tokens = tokenResp.tokens;
    client.setCredentials(tokens);

    const accessToken = tokens.access_token ?? null;
    const refreshToken = tokens.refresh_token ?? null;
    const expiresAtSec = tokens.expiry_date
      ? Math.floor(tokens.expiry_date / 1000)
      : null;
    const scopeStr =
      Array.isArray(tokens.scope) && tokens.scope.length > 0
        ? tokens.scope.join(" ")
        : typeof tokens.scope === "string"
        ? tokens.scope
        : null;

    const provider = "google-business" as const;

    if (!accessToken) {
      console.error("[Google Business Callback] Missing access token");
      return NextResponse.redirect(
        `${redirectAfter}?error=missing_access_token`,
      );
    }

    // 1.bis) Si no viene companyId en state, usamos la última company creada por este usuario
    if (!companyId) {
      const lastCompany = await prisma.company.findFirst({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (lastCompany) {
        companyId = lastCompany.id;
      }
    }

    // 2) Crear o actualizar ExternalConnection
    const existing = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    let externalConnectionId: string;

    if (existing) {
      const updateData: any = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAtSec,
        scope: scopeStr,
      };
      if (companyId) updateData.companyId = companyId;
      if (accountEmail) updateData.accountEmail = accountEmail;

      const updated = await prisma.externalConnection.update({
        where: { id: existing.id },
        data: updateData,
      });

      externalConnectionId = updated.id;
    } else {
      const created = await prisma.externalConnection.create({
        data: {
          userId,
          provider,
          access_token: accessToken,
          refresh_token: refreshToken || undefined,
          expires_at: expiresAtSec || undefined,
          scope: scopeStr || undefined,
          companyId: companyId || undefined,
          accountEmail: accountEmail || undefined,
        },
      });

      externalConnectionId = created.id;
    }

    // 3) Si tenemos companyId, lanzar sincronizaciones internas en segundo plano
    if (companyId) {
      const baseUrl = appUrl;
      const payload = JSON.stringify({ companyId });

      // 3.1) Sync de cuentas GBP -> tabla google_gbp_account
      try {
        const respAcc = await fetch(
          `${baseUrl}/api/integrations/google/business-profile/sync/accounts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          },
        );

        if (!respAcc.ok) {
          const text = await respAcc.text().catch(() => "");
          console.error(
            "[Google Business Callback] accounts sync failed",
            respAcc.status,
            text.slice(0, 300),
          );
        }
      } catch (err) {
        console.error(
          "[Google Business Callback] Error lanzando sync de accounts:",
          err,
        );
      }

      // 3.2) Sync de locations GBP -> tabla google_gbp_location
      try {
        const respLoc = await fetch(
          `${baseUrl}/api/integrations/google/business-profile/sync/locations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          },
        );

        if (!respLoc.ok) {
          const text = await respLoc.text().catch(() => "");
          console.error(
            "[Google Business Callback] locations sync failed",
            respLoc.status,
            text.slice(0, 300),
          );
        }
      } catch (err) {
        console.error(
          "[Google Business Callback] Error lanzando sync de locations:",
          err,
        );
      }

      // 3.3) Sync de reviews GBP -> tabla google_gbp_reviews
      try {
        const respRev = await fetch(
          `${baseUrl}/api/integrations/google/business-profile/sync/reviews`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
          },
        );

        if (!respRev.ok) {
          const text = await respRev.text().catch(() => "");
          console.error(
            "[Google Business Callback] reviews sync failed",
            respRev.status,
            text.slice(0, 300),
          );
        }
      } catch (err) {
        console.error(
          "[Google Business Callback] Error lanzando sync de reviews:",
          err,
        );
      }
    }

    // 4) Marcar google_connected=1 en la URL de vuelta
    try {
      const redirectUrl = new URL(redirectAfter);
      redirectUrl.searchParams.set("google_connected", "1");
      redirectAfter = redirectUrl.toString();
    } catch (e) {
      console.error(
        "[Google Business Callback] invalid redirectAfter URL:",
        redirectAfter,
        e,
      );
    }

    // 🔚 Volver SIEMPRE a redirectAfter (lo decide quien llamó a /connect)
    return NextResponse.redirect(redirectAfter);
  } catch (err) {
    console.error("[Google Business Callback] Error:", err);
    return NextResponse.redirect(
      `${redirectAfter}?error=google_business_callback`,
    );
  }
}
