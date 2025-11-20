// app/api/integrations/google/business-profile/sync/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
  listGbpAccounts,
} from "@/lib/integrations/google-business/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1) Leer body
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 }
      );
    }

    // 2) Resolver ExternalConnection (validación + existencia)
    const ext = await getExternalConnectionForCompany(companyId);

    // 3) AccessToken válido (incluye refresh automático)
    const accessToken = await getValidAccessToken(ext);

    // 4) Llamar a MyBusiness → accounts.list
    const accounts = await listGbpAccounts(accessToken);

    if (!accounts.length) {
      return NextResponse.json(
        { ok: false, error: "no_accounts_found" },
        { status: 404 }
      );
    }

    // Solo trabajamos con la primera (Google Business Profile solo permite 1)
    const account = accounts[0];

    if (!account.name) {
      return NextResponse.json(
        { ok: false, error: "invalid_account_name" },
        { status: 500 }
      );
    }

    const rawName = account.name; // "accounts/123456..."
    const googleAccountId = rawName.includes("/")
      ? rawName.split("/")[1]
      : rawName;
    const googleAccountName = account.accountName ?? null;

    // 5) UPSERT en google_gbp_account
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
      synced: true,
      accountId: gbpAccount.id,
      googleAccountId,
      googleAccountName,
    });
  } catch (err: any) {
    console.error("[GBP][accounts/sync] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unexpected_error" },
      { status: 500 }
    );
  }
}
