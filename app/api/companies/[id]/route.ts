// app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, CompanyRole } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Whitelist de bandas de empleados
const EMP_BANDS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;
type EmpBand = typeof EMP_BANDS[number];

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

/** GET /api/companies/[id] — detalles para la primera card */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        employeesBand: true, // 👈 banda de empleados (string)
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, company });
  } catch (e) {
    console.error("[GET /api/companies/[id]]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 }
    );
  }
}

type PatchCompanyBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employeesBand?: string | null; // 👈 picklist
};

/** PATCH /api/companies/[id] — actualizar campos (solo OWNER) */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const session = await getServerSession(authOptions);
    const guard = await ensureOwner(session?.user?.email ?? null, companyId);
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    const body = (await req.json().catch(() => ({}))) as Partial<PatchCompanyBody>;

    const data: Record<string, any> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.email === "string") data.email = body.email.trim() || null;
    if (typeof body.phone === "string") data.phone = body.phone.trim() || null;
    if (typeof body.address === "string") data.address = body.address.trim() || null;

    if (body.employeesBand !== undefined) {
      const v = (body.employeesBand ?? "").trim();
      if (v === "") {
        data.employeesBand = null; // limpiar
      } else if ((EMP_BANDS as readonly string[]).includes(v)) {
        data.employeesBand = v as EmpBand;
      } else {
        return NextResponse.json({ ok: false, error: "bad_employeesBand" }, { status: 400 });
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "no_fields" }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        employeesBand: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, company });
  } catch (e) {
    console.error("[PATCH /api/companies/[id]]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 }
    );
  }
}

/** DELETE /api/companies/[id] — borrar empresa (solo OWNER) */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const session = await getServerSession(authOptions);
    const guard = await ensureOwner(session?.user?.email ?? null, companyId);
    if (!guard.ok) {
      return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
    }

    await prisma.userCompany.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[DELETE /api/companies/[id]]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 }
    );
  }
}
