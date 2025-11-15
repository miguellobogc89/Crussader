// app/api/integrations/google/business-profile/sync/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    const provider = "google-business";

    const ext = await prisma.externalConnection.findFirst({
      where: { companyId, provider },
      orderBy: { createdAt: "desc" },
    });

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "no_external_connection" },
        { status: 404 },
      );
    }

    if (!ext.access_token && !ext.refresh_token) {
      return NextResponse.json(
        { ok: false, error: "no_tokens_for_connection" },
        { status: 400 },
      );
    }

    const redirectUri =
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      redirectUri,
    );

    let accessToken = ext.access_token ?? null;

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpired =
      typeof ext.expires_at === "number" && ext.expires_at < nowSec - 60;

    if ((!accessToken || isExpired) && ext.refresh_token) {
      try {
        client.setCredentials({ refresh_token: ext.refresh_token });
        const newTokenResp = await client.getAccessToken();
        const newAccessToken = newTokenResp?.token ?? null;

        if (!newAccessToken) {
          throw new Error("empty_access_token_after_refresh");
        }

        accessToken = newAccessToken;

        const expiryMs = client.credentials.expiry_date;
        const newExpiresAtSec =
          typeof expiryMs === "number"
            ? Math.floor(expiryMs / 1000)
            : null;

        await prisma.externalConnection.update({
          where: { id: ext.id },
          data: {
            access_token: newAccessToken,
            expires_at: newExpiresAtSec ?? undefined,
          },
        });
      } catch (err) {
        console.error("[GBP][accounts/sync] error refreshing token:", err);
        return NextResponse.json(
          { ok: false, error: "token_refresh_failed" },
          { status: 401 },
        );
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "no_valid_access_token" },
        { status: 401 },
      );
    }

    const accountsResp = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!accountsResp.ok) {
      const text = await accountsResp.text().catch(() => "");
      console.error(
        "[GBP][accounts/sync] accounts.list failed",
        accountsResp.status,
        text,
      );
      return NextResponse.json(
        {
          ok: false,
          error: "google_api_error",
          status: accountsResp.status,
          message: text || undefined,
        },
        { status: 502 },
      );
    }

    const data = (await accountsResp.json()) as {
      accounts?: { name?: string; accountName?: string | null; [k: string]: any }[];
    };

    const account = data.accounts && data.accounts[0];

    if (!account || !account.name) {
      return NextResponse.json(
        { ok: false, error: "no_accounts_found" },
        { status: 404 },
      );
    }

    const rawName = account.name; // "accounts/11814..."
    const googleAccountId = rawName.includes("/")
      ? rawName.split("/")[1]
      : rawName;
    const googleAccountName = account.accountName ?? null;

    const gbpAccount = await prisma.google_gbp_account.upsert({
      where: {
        company_id_google_account_id: {
          company_id: companyId,
          google_account_id: googleAccountId,
        },
      },
      create: {
        company_id: companyId,
        external_connection_id: ext.id,
        google_account_id: googleAccountId,
        google_account_name: googleAccountName ?? undefined,
        status: "active",
        meta: account as any,
      },
      update: {
        external_connection_id: ext.id,
        google_account_name: googleAccountName ?? undefined,
        status: "active",
        meta: account as any,
      },
    });

    return NextResponse.json({
      ok: true,
      accountId: gbpAccount.id,
      googleAccountId,
      googleAccountName,
    });
  } catch (err) {
    console.error("[GBP][accounts/sync] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
