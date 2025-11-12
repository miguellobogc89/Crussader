// app/api/integrations/google/business-profile/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

const isDev = process.env.NODE_ENV !== "production";

export async function GET(req: NextRequest) {
  const diag: Record<string, unknown> = { step: "init" };

  try {
    // 1) Sesión (JWT strategy)
    diag.step = "get_session";
    const session = await getServerSession(authOptions);
    diag.session_ok = !!(session && session.user);
    diag.session_user_id = (session?.user as any)?.id || null;

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        isDev ? { ok: false, error: "no_session", diag } : { ok: false, error: "no_session" },
        { status: 401 }
      );
    }
    const userId = (session.user as any).id as string;

    // 2) ExternalConnection (provider google-business)
    diag.step = "find_external_connection";
    const conn = await prisma.externalConnection.findFirst({
      where: { userId, provider: "google-business" },
      select: { id: true, access_token: true, companyId: true, createdAt: true, updatedAt: true },
    });
    diag.external_found = !!conn;
    diag.external_id = conn?.id || null;
    diag.external_companyId = conn?.companyId || null;

    if (!conn?.access_token) {
      return NextResponse.json(
        isDev ? { ok: false, error: "no_google_business_connection", diag } : { ok: false, error: "no_google_business_connection" },
        { status: 404 }
      );
    }

    // 3) Llamada correcta: Account Management v1 (no v4)
    //    Con scope aprobado `https://www.googleapis.com/auth/business.manage`
    diag.step = "google_accounts_fetch_v1";
    const url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });

    const bodyText = await res.text(); // Leer UNA vez
    let data: any = null;
    try {
      data = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      data = { _non_json_body: bodyText };
    }
    diag.google_status = res.status;

    if (!res.ok) {
      return NextResponse.json(
        isDev ? { ok: false, error: "google_api_error", details: data, diag } : { ok: false, error: "google_api_error", details: data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      accounts: data.accounts ?? [],
      raw: isDev ? data : undefined,
      diag: isDev ? diag : undefined,
    });
  } catch (e: any) {
    diag.step = "exception";
    diag.message = e?.message || String(e);
    return NextResponse.json(isDev ? { ok: false, error: "exception", diag } : { ok: false, error: "exception" }, { status: 500 });
  }
}
