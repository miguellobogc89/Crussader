// app/api/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CompanyRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    const role = (session?.user as any)?.role ?? "user";
    const isSystemAdmin = role === "system_admin";
    if (!email && !isSystemAdmin) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const all = req.nextUrl.searchParams.get("all") === "1";

    let companies: Array<{
      id: string;
      name: string;
      brandColor: string | null;
      logoUrl: string | null;
      createdAt: Date;
    }> = [];

    if (isSystemAdmin && all) {
      companies = await prisma.company.findMany({
        select: { id: true, name: true, brandColor: true, logoUrl: true, createdAt: true },
        orderBy: { name: "asc" },
      });
    } else {
      const me = email
        ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
        : null;
      if (!me) return NextResponse.json({ ok: true, companies: [] });

      const memberships = await prisma.userCompany.findMany({
        where: { userId: me.id },
        select: { companyId: true },
      });
      const companyIds = memberships.map((m) => m.companyId);
      if (companyIds.length === 0) return NextResponse.json({ ok: true, companies: [] });

      companies = await prisma.company.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true, brandColor: true, logoUrl: true, createdAt: true },
        orderBy: { name: "asc" },
      });
    }

    const ids = companies.map((c) => c.id);
    let countsMap = new Map<string, number>();
    if (ids.length) {
      const grouped = await prisma.location.groupBy({
        by: ["companyId"],
        where: { companyId: { in: ids } },
        _count: { _all: true },
      });
      countsMap = new Map(grouped.map((g) => [g.companyId, g._count._all]));
    }

    const rows = companies.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.brandColor ?? null,
      logoUrl: c.logoUrl ?? null,
      locationsCount: countsMap.get(c.id) ?? 0,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ ok: true, companies: rows });
  } catch (e) {
    console.error("[GET /api/companies]", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const { name } = (await req.json().catch(() => ({}))) as { name?: string };
    const cleanName = (name ?? "").trim();
    if (!cleanName) {
      return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1) Crear account por SQL crudo con valores por defecto (id UUID autogenerado)
      const createdAccounts = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "account" DEFAULT VALUES
        RETURNING id
      `;
      const accountId = createdAccounts[0]?.id;

      if (!accountId) {
        throw new Error("account_create_failed");
      }

      // 2) Crear la company conectando el account recién creado
      const company = await tx.company.create({
        data: {
          name: cleanName,
          createdById: me.id,
          account: {
            connect: { id: accountId },
          },
        },
        select: { id: true, name: true, createdAt: true },
      });

      // 3) Dar membership OWNER al creador
      await tx.userCompany.create({
        data: { userId: me.id, companyId: company.id, role: CompanyRole.OWNER },
      });

      return company;
    });

    return NextResponse.json({ ok: true, company: result }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "duplicate" }, { status: 409 });
    }
    console.error("[POST /api/companies]", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
