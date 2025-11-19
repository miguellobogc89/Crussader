// app/api/integrations/google/business-profile/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

const isDev = process.env.NODE_ENV !== "production";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const diag: Record<string, unknown> = { step: "init" };

  try {
    // 1) Sesión → userId
    diag.step = "get_session";
    const session = await getServerSession(authOptions);
    diag.session_ok = !!(session && session.user);
    diag.session_user_id = (session?.user as any)?.id || null;

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        isDev
          ? { ok: false, error: "no_session", diag }
          : { ok: false, error: "no_session" },
        { status: 401 },
      );
    }

    const userId = (session.user as any).id as string;

    // 2) Última relación UserCompany de este usuario
    diag.step = "find_user_company";
    const uc = await prisma.userCompany.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    diag.user_company_found = !!uc;
    diag.user_company_companyId = uc?.Company?.id || null;

    if (!uc || !uc.Company) {
      return NextResponse.json(
        isDev
          ? { ok: false, error: "no_company_for_user", diag }
          : { ok: false, error: "no_company_for_user" },
        { status: 404 },
      );
    }

    const companyId = uc.Company.id;

    // 3) Leer cuentas GBP de esa company (tabla google_gbp_account)
    diag.step = "load_gbp_accounts_from_db";

    const rows = await prisma.google_gbp_account.findMany({
      where: {
        company_id: companyId,
      },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        company_id: true,
        external_connection_id: true,
        google_account_id: true,
        google_account_name: true,
        status: true,
        created_at: true,
        updated_at: true,
        meta: true,
      },
    });

    diag.accounts_count = rows.length;

    return NextResponse.json(
      {
        ok: true,
        accounts: rows.map((row) => ({
          id: row.id,                      // 👈 id de la cuenta GBP (UUID interno)
          companyId: row.company_id,
          externalConnectionId: row.external_connection_id,
          googleAccountId: row.google_account_id,
          googleAccountName: row.google_account_name,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          meta: row.meta,
        })),
        diag: isDev ? diag : undefined,
      },
      { status: 200 },
    );
  } catch (e: any) {
    diag.step = "exception";
    diag.message = e?.message || String(e);
    return NextResponse.json(
      isDev
        ? { ok: false, error: "exception", diag }
        : { ok: false, error: "exception" },
      { status: 500 },
    );
  }
}
