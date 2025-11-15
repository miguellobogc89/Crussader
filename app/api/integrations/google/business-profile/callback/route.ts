// app/api/integrations/google/business-profile/callback/route.ts
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
      // ignorar errores de parseo
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

    // 3) Si tenemos companyId, llamar a accounts.list y guardar en google_gbp_account
    if (companyId) {
      try {
        const accountsResp = await fetch(
          "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!accountsResp.ok) {
          console.error(
            "[Google Business Callback] accounts.list failed",
            accountsResp.status,
            await accountsResp.text(),
          );
        } else {
          const data = (await accountsResp.json()) as {
            accounts?: { name?: string; accountName?: string }[];
          };

          const account = data.accounts && data.accounts[0];

          if (account && account.name) {
            const rawName = account.name; // "accounts/118141498427943054563"
            const googleAccountId = rawName.includes("/")
              ? rawName.split("/")[1]
              : rawName;
            const googleAccountName = account.accountName ?? null;

            // UPSERT en google_gbp_account
            await prisma.$queryRawUnsafe(
              `
              INSERT INTO google_gbp_account
                (company_id, external_connection_id, google_account_id, google_account_name, status)
              VALUES
                ($1, $2, $3, $4, 'active')
              ON CONFLICT (company_id, google_account_id)
              DO UPDATE SET
                external_connection_id = EXCLUDED.external_connection_id,
                google_account_name    = EXCLUDED.google_account_name,
                status                 = 'active',
                updated_at             = now()
              `,
              companyId,
              externalConnectionId,
              googleAccountId,
              googleAccountName,
            );
          } else {
            console.warn(
              "[Google Business Callback] accounts.list returned no accounts",
            );
          }
        }
      } catch (err) {
        console.error("[Google Business Callback] Error fetching accounts:", err);
      }

      // 4) Disparar sincronización de reviews (todas las ubicaciones de esta company)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!baseUrl) {
          console.error(
            "[Google Business Callback] NEXT_PUBLIC_APP_URL no definido, no se lanza sync de reviews",
          );
        } else {
          const resp = await fetch(
            `${baseUrl}/api/integrations/google/business-profile/reviews`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyId }),
            },
          );

          if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            console.error(
              "[Google Business Callback] reviews sync failed",
              resp.status,
              text.slice(0, 300),
            );
          }
        }
      } catch (err) {
        console.error(
          "[Google Business Callback] Error lanzando sync de reviews:",
          err,
        );
      }
    }

    return NextResponse.redirect(
      `${redirectAfter}?connected=google_business`,
    );
  } catch (err) {
    console.error("[Google Business Callback] Error:", err);
    return NextResponse.redirect(
      `${redirectAfter}?error=google_business_callback`,
    );
  }
}
