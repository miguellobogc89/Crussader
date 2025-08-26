import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, Prisma } from "@prisma/client";
// ❌ import { PrismaAdapter } from "@next-auth/prisma-adapter"; // <- eliminado
import { errorMessage } from "@/lib/error-message";

const prisma = new PrismaClient();

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: true, companies: [] });
    }

    const companies = await prisma.company.findMany({
      where: { UserCompany: { some: { userId: user.id } } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        UserCompany: {
          where: { userId: user.id },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = companies.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.UserCompany[0]?.role ?? "MEMBER",
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ ok: true, companies: rows });
  } catch (e: unknown) {
    console.error("[GET /api/companies] error:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        createdById: user.id,
      },
      select: { id: true, name: true, createdAt: true },
    });

    // ⚠️ Mantén la lógica actual pero silencia SOLO esta regla en esta línea.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.userCompany.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: "OWNER" as Prisma.UserCompanyCreateInput["role"],
      },
    });


    return NextResponse.json({ ok: true, company });
  } catch (e: unknown) {
    console.error("[GET /companies/:id] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
}
}
