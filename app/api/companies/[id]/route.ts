import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, CompanyRole } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";

const prisma = new PrismaClient();

async function ensureOwner(userEmail: string | null, companyId: string) {
  if (!userEmail) return { ok: false as const, status: 401, error: "unauth" };
  const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
  if (!user) return { ok: false as const, status: 401, error: "no_user" };

  const membership = await prisma.userCompany.findFirst({
    where: { userId: user.id, companyId, role: CompanyRole.OWNER },
    select: { id: true },
  });
  if (!membership) return { ok: false as const, status: 403, error: "forbidden" };

  return { ok: true as const, userId: user.id };
}

type PatchCompanyBody = { name?: string };

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const session = await getServerSession(authOptions);
    const guard = await ensureOwner(session?.user?.email ?? null, companyId);
    if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

    const body = (await req.json().catch(() => ({}))) as Partial<PatchCompanyBody>;
    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { ...(name ? { name } : {}) },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, company });
  } catch (e: unknown) {
    console.error("[PATCH /api/companies/[id]]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const session = await getServerSession(authOptions);
    const guard = await ensureOwner(session?.user?.email ?? null, companyId);
    if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

    // borra relaciones y luego la empresa
    await prisma.userCompany.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[DELETE /api/companies/:id] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}
