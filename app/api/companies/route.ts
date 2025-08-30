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

    // ✅ Admin global + ?all=1 ⇒ devolver TODAS las companies
    if (isSystemAdmin && all) {
      const companies = await prisma.company.findMany({
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      const rows = companies.map((c) => ({
        id: c.id,
        name: c.name,
        // Devolvemos algún rol válido para no romper tipos en el cliente
        role: CompanyRole.ADMIN,
        createdAt: c.createdAt,
      }));

      return NextResponse.json({ ok: true, companies: rows });
    }

    // 👇 Resto de usuarios: solo companies donde es miembro
    const me = email
      ? await prisma.user.findUnique({ where: { email }, select: { id: true } })
      : null;

    if (!me) return NextResponse.json({ ok: true, companies: [] });

    const companies = await prisma.company.findMany({
      where: { UserCompany: { some: { userId: me.id } } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        UserCompany: {
          where: { userId: me.id },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = companies.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.UserCompany[0]?.role ?? CompanyRole.MEMBER,
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
      const company = await tx.company.create({
        data: { name: cleanName, createdById: me.id },
        select: { id: true, name: true, createdAt: true },
      });

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
