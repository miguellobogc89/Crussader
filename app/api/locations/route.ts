// app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

/**
 * GET /api/locations?companyId=...
 * Devuelve las ubicaciones visibles del usuario en esa empresa.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId_required" }, { status: 400 });
    }

    // Sesión
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // Usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    // Si NO es admin, validar que pertenece a la empresa
    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: { userId: user.id, companyId },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }

    // Mismo comportamiento que el endpoint funcional
    const locations = await prisma.location.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        city: true,
        featuredImageUrl: true,
        status: true,
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ ok: true, locations });
  } catch (e) {
    console.error("[GET /api/locations]", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
