export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayUtcStart } from "@/lib/kpis";

function num(x: any): number | null {
  return x == null ? null : Number(x);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const locationId = params?.id;
    if (!locationId) {
      return NextResponse.json({ ok: false, error: "missing_locationId" }, { status: 400 });
    }

    const snapshotToday = todayUtcStart();

    // 1️⃣ Datos base de la ubicación
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        title: true,
        city: true,
        status: true,
        slug: true,
        companyId: true,
        featuredImageUrl: true,
        reviewsAvg: true,
        reviewsCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 2️⃣ Snapshot de hoy
    const todayKpi = await prisma.locationKpiDaily.findFirst({
      where: { locationId, snapshotDate: snapshotToday },
      select: {
        snapshotDate: true,
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        responses7d: true,
        answeredRate: true,
        avgAll: true,
        avg30d: true,
        prev30dAvg: true,
        responseAvgSec: true,
      },
    });

    // 3️⃣ Snapshot más reciente
    const latestKpi = await prisma.locationKpiDaily.findFirst({
      where: { locationId },
      orderBy: { snapshotDate: "desc" },
      select: {
        snapshotDate: true,
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        responses7d: true,
        answeredRate: true,
        avgAll: true,
        avg30d: true,
        prev30dAvg: true,
        responseAvgSec: true,
      },
    });

    // 4️⃣ Histórico últimos 30 días
    const last30 = await prisma.locationKpiDaily.findMany({
      where: { locationId },
      orderBy: { snapshotDate: "desc" },
      take: 30,
      select: {
        snapshotDate: true,
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        responses7d: true,
        answeredRate: true,
        avgAll: true,
        avg30d: true,
        prev30dAvg: true,
        responseAvgSec: true,
      },
    });

    // Helper de mapeo
    const mapKpi = (k: any) =>
      !k
        ? null
        : {
            snapshotDate: k.snapshotDate ? new Date(k.snapshotDate).toISOString() : null,
            totalReviews: k.totalReviews ?? 0,
            newReviews7d: k.newReviews7d ?? 0,
            newReviews30d: k.newReviews30d ?? 0,
            unansweredCount: k.unansweredCount ?? 0,
            responses7d: k.responses7d ?? 0,
            answeredRate: k.answeredRate ?? null,
            avgAll: num(k.avgAll),
            avg30d: num(k.avg30d),
            prev30dAvg: num(k.prev30dAvg),
            responseAvgSec: k.responseAvgSec ?? null,
          };

    // 1.b️⃣ Nuevas reseñas últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

    const recentReviewsCount = await prisma.review.count({
      where: {
        locationId,
        createdAtG: { gte: sevenDaysAgo },
      },
    });

    const today = mapKpi(todayKpi);
    const latest = mapKpi(latestKpi);
    const history = last30.map(mapKpi);

    // 🟦 Cálculo de mejora/empeora del rating
    let ratingToday: number | null = null;
    let rating30DaysAgo: number | null = null;
    let ratingDelta: number | null = null;
    let ratingDeltaPct: number | null = null;

    // Usa KPI si existe, sino los datos base de la location
    if (latestKpi) {
      ratingToday = num(latestKpi.avg30d) ?? num(latestKpi.avgAll);
      rating30DaysAgo = num(latestKpi.prev30dAvg);
    } else if (location) {
      ratingToday = num(location.reviewsAvg);
      rating30DaysAgo = num(location.reviewsAvg); // fallback si no hay histórico
    }

    if (ratingToday != null && rating30DaysAgo != null && rating30DaysAgo !== 0) {
      ratingDelta = ratingToday - rating30DaysAgo;
      ratingDeltaPct = ((ratingToday - rating30DaysAgo) / rating30DaysAgo) * 100;
    }

    // Totales
    const totals = latest
      ? {
          totalReviews: latest.totalReviews,
          newReviews7d: latest.newReviews7d,
          newReviews30d: latest.newReviews30d,
          unansweredCount: latest.unansweredCount,
          responses7d: latest.responses7d,
        }
      : {
          totalReviews: location?.reviewsCount ?? 0,
          newReviews7d: recentReviewsCount,
          newReviews30d: null,
          unansweredCount: null,
          responses7d: null,
        };

    // Rates
    const rates = {
      avgAll: ratingToday,
      ratingToday,
      rating30DaysAgo,
      ratingDelta,
      ratingDeltaPct,
    };

    // ✅ Salida final unificada
    return NextResponse.json({
      ok: true,
      data: {
        location: location
          ? {
              ...location,
              reviewsAvg: num(location.reviewsAvg),
              reviewsCount: location.reviewsCount ?? 0,
              createdAt: location.createdAt?.toISOString?.() ?? null,
              updatedAt: location.updatedAt?.toISOString?.() ?? null,
            }
          : null,
        kpis: {
          todayDateUtc: snapshotToday.toISOString(),
          today,
          latest,
          history,
          totals,
          rates,
        },
        totals,
        rates,
        recentReviewsCount,
      },
    });
  } catch (e: any) {
    console.error("[GET /api/locations/[id]] 💥 Error completo:", e);
    return NextResponse.json(
      { ok: false, error: e.message || String(e) },
      { status: 500 }
    );
  }
}
