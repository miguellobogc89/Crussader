// app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { todayUtcStart } from "@/lib/kpis";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

/**
 * GET /api/locations?companyId=...
 * Devuelve las ubicaciones visibles del usuario en esa empresa,
 * incluyendo los KPIs mínimos que espera la ReviewsPage:
 * - reviewsAvg
 * - reviewsCount
 * (Opcionalmente pendingResponses si quieres pintarlo también)
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

    // Ubicaciones base
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

    if (locations.length === 0) {
      return NextResponse.json({ ok: true, locations: [] });
    }

    // KPIs del snapshot de hoy (para rellenar reviewsAvg y reviewsCount)
    const snapshotDate = todayUtcStart();
    const ids = locations.map((l) => l.id);

    const kpis = await prisma.locationKpiDaily.findMany({
      where: { companyId, locationId: { in: ids }, snapshotDate },
      select: {
        locationId: true,
        totalReviews: true,
        avgAll: true,
        unansweredCount: true, // útil si quieres "pendingResponses"
      },
    });

    const kpimap = new Map(
      kpis.map((k) => [
        k.locationId,
        {
          reviewsCount: k.totalReviews ?? 0,
          reviewsAvg: k.avgAll != null ? Number(k.avgAll) : null,
          pendingResponses: k.unansweredCount ?? 0,
        },
      ])
    );

    // Mezclar datos base + KPIs mínimos que espera la UI
    const enriched = locations.map((l) => {
      const k = kpimap.get(l.id);
      return {
        id: l.id,
        title: l.title,
        city: l.city,
        featuredImageUrl: l.featuredImageUrl,
        status: l.status,
        reviewsAvg: k?.reviewsAvg ?? null,
        reviewsCount: k?.reviewsCount ?? 0,
        // Si no quieres usarlo aún, no pasa nada por enviarlo:
        pendingResponses: k?.pendingResponses ?? 0,
      };
    });

    return NextResponse.json({ ok: true, locations: enriched });
  } catch (e) {
    console.error("[GET /api/locations]", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
