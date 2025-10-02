// app/api/companies/accessible/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function isSystemAdmin(user: any): boolean {
  // Prisma enum Role en tu proyecto: system_admin | org_admin | user | test
  return (user?.role ?? "").toLowerCase() === "system_admin";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const userId: string | undefined = user?.id;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const select = {
      id: true,
      name: true,
      brandColor: true,
      logoUrl: true,
      createdAt: true,
    } as const;

    const companies = isSystemAdmin(user)
      ? await prisma.company.findMany({ select, orderBy: { name: "asc" } })
      : await prisma.company.findMany({
          where: { UserCompany: { some: { userId } } }, // unión real en tu schema
          select,
          orderBy: { name: "asc" },
        });

    // === Conteo de ubicaciones (LOCATION) por empresa ===
    const companyIds = companies.map((c) => c.id);
    let countsMap = new Map<string, number>();
    if (companyIds.length > 0) {
      const grouped = await prisma.location.groupBy({
        by: ["companyId"],
        where: { companyId: { in: companyIds } },
        _count: { _all: true },
      });
      countsMap = new Map(grouped.map((g) => [g.companyId, g._count._all]));
    }

    // Cookie para defaultCompanyId
    const cookieId = req.cookies.get("last_company_id")?.value ?? null;
    const hasCookie = cookieId && companies.some((x) => x.id === cookieId);
    const defaultCompanyId = hasCookie ? cookieId : companies[0]?.id ?? null;

    return NextResponse.json({
      ok: true,
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.brandColor ?? null,
        logoUrl: c.logoUrl ?? null,
        locationsCount: countsMap.get(c.id) ?? 0,
      })),
      defaultCompanyId,
    });
  } catch (e) {
    console.error("[GET /api/companies/accessible]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 }
    );
  }
}
