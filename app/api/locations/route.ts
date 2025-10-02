// app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function isSystemAdmin(user: any): boolean {
  return (user?.role ?? "").toLowerCase() === "system_admin";
}

/**
 * GET /api/locations?companyId=...&limit=50
 * Devuelve las locations de esa company.
 * - Si el usuario es system_admin → OK siempre.
 * - Si no, debe tener vínculo con la company (UserCompany) o devolvemos 403.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const userId: string | undefined = user?.id;

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // Si NO es admin, comprobamos que el usuario pertenece a esa company
    if (!isSystemAdmin(user)) {
      const membership = await prisma.userCompany.findFirst({
        where: { userId, companyId },
        select: { id: true },
      });
      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    // Traemos locations básicas de esa company
    const rows = await prisma.location.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        city: true,
        featuredImageUrl: true,
        reviewsAvg: true,     // Decimal?
        reviewsCount: true,
        status: true,
      },
      orderBy: { title: "asc" },
      take: limit,
    });

    // Normalizamos Decimal → number
    const locations = rows.map((l) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      featuredImageUrl: l.featuredImageUrl ?? null,
      reviewsAvg:
        l.reviewsAvg === null || l.reviewsAvg === undefined
          ? null
          : Number(l.reviewsAvg),
      reviewsCount: l.reviewsCount ?? 0,
      status: l.status, // LocationStatus
    }));

    return NextResponse.json({ ok: true, locations });
  } catch (e) {
    console.error("[GET /api/locations]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
