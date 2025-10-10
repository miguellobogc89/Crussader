// app/api/companies/[id]/kpis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { todayUtcStart } from "@/lib/kpis";

export const dynamic = "force-dynamic";

/**
 * GET /api/companies/[id]/kpis
 * Snapshot (UTC hoy) de KPIs agregados de la compañía:
 * - totals: sumas (reviews totales, nuevas 7/30d, sin responder, respuestas 7d)
 * - rates: promedios ponderados (rating global, 30d, prev30d) y delta 30d
 * - responseAvgSec: promedio ponderado por nº de respuestas (si disponible)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const companyId = params.id;
    if (!companyId) return NextResponse.json({ ok: false, error: "missing_companyId" }, { status: 400 });

    // Validación de acceso: el usuario debe pertenecer a la compañía (o ser system_admin)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";
    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: { userId: user.id, companyId },
        select: { id: true },
      });
      if (!membership) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const snapshotDate = todayUtcStart();

    // Traemos TODOS los KPIs de las locations de la company para hoy
    const rows = await prisma.locationKpiDaily.findMany({
      where: { companyId, snapshotDate },
      select: {
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        responses7d: true,
        answeredRate: true,
        avgAll: true,      // Decimal
        avg30d: true,      // Decimal
        prev30dAvg: true,  // Decimal
        responseAvgSec: true,
      },
    });

    // Acumuladores para sumas
    let totalReviews = 0;
    let newReviews7d = 0;
    let newReviews30d = 0;
    let unansweredCount = 0;
    let responses7d = 0;

    // Para promedios ponderados por nº de reviews
    let wAvgAll_num = 0;     // Σ (avgAll * totalReviews)
    let wAvg30d_num = 0;     // Σ (avg30d * totalReviews)
    let wPrev30d_num = 0;    // Σ (prev30dAvg * totalReviews)
    let weightReviews = 0;   // Σ totalReviews

    // Para responseAvgSec ponderado por nº de respuestas (si quieres ponderar por respuestas 7d)
    let wRespSec_num = 0;    // Σ (responseAvgSec * responses7d)
    let weightResponses = 0; // Σ responses7d

    for (const r of rows) {
      const tot = r.totalReviews ?? 0;
      const resp7 = r.responses7d ?? 0;

      totalReviews += tot;
      newReviews7d += r.newReviews7d ?? 0;
      newReviews30d += r.newReviews30d ?? 0;
      unansweredCount += r.unansweredCount ?? 0;
      responses7d += resp7;

      const avgAll = r.avgAll != null ? Number(r.avgAll) : null;
      const avg30 = r.avg30d != null ? Number(r.avg30d) : null;
      const prev30 = r.prev30dAvg != null ? Number(r.prev30dAvg) : null;

      if (avgAll != null && tot > 0) {
        wAvgAll_num += avgAll * tot;
      }
      if (avg30 != null && tot > 0) {
        wAvg30d_num += avg30 * tot;
      }
      if (prev30 != null && tot > 0) {
        wPrev30d_num += prev30 * tot;
      }
      if (r.responseAvgSec != null && resp7 > 0) {
        wRespSec_num += r.responseAvgSec * resp7;
      }
      weightReviews += tot;
      weightResponses += resp7;
    }

    const avgAllWeighted = weightReviews > 0 ? wAvgAll_num / weightReviews : null;
    const avg30dWeighted = weightReviews > 0 ? wAvg30d_num / weightReviews : null;
    const prev30dWeighted = weightReviews > 0 ? wPrev30d_num / weightReviews : null;
    const responseAvgSecWeighted = weightResponses > 0 ? Math.round((wRespSec_num / weightResponses) * 10) / 10 : null;

    let ratingDelta30dPct: number | null = null;
    if (prev30dWeighted != null && prev30dWeighted !== 0 && avg30dWeighted != null) {
      ratingDelta30dPct = ((avg30dWeighted - prev30dWeighted) / prev30dWeighted) * 100;
      ratingDelta30dPct = Math.round(ratingDelta30dPct * 10) / 10; // 1 decimal
    }

    return NextResponse.json({
      ok: true,
      data: {
        totals: {
          totalReviews,
          newReviews7d,
          newReviews30d,
          unansweredCount,
          responses7d,
        },
        rates: {
          avgAll: avgAllWeighted != null ? Math.round(avgAllWeighted * 10) / 10 : null,
          avg30d: avg30dWeighted != null ? Math.round(avg30dWeighted * 10) / 10 : null,
          prev30dAvg: prev30dWeighted != null ? Math.round(prev30dWeighted * 10) / 10 : null,
          ratingDelta30dPct,
          responseAvgSec: responseAvgSecWeighted,
        },
      },
    });
  } catch (e) {
    console.error("[GET /api/companies/[id]/kpis]", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
