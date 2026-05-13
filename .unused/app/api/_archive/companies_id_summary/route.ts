import { NextResponse } from "next/server";
import { PrismaClient, ReviewProvider } from "@prisma/client";

const prisma = new PrismaClient();
const PROVIDER = ReviewProvider.GOOGLE;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 14: params es Promise
) {
  const { id: companyId } = await ctx.params;

  // Ventanas de tiempo para crecimiento (últimos 30 vs 30 previos)
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);

  // 1) Bases
  const [totalEstablishments, aggAll, last30, prev30] = await Promise.all([
    prisma.location.count({ where: { companyId } }),

    // Total reseñas y promedio rating desde REVIEW (fuente primaria si existe)
    prisma.review.aggregate({
      where: { companyId, provider: PROVIDER },
      _avg: { rating: true },
      _count: { _all: true },
    }),

    // Reseñas últimos 30 días (fecha real de Google)
    prisma.review.count({
      where: {
        companyId,
        provider: PROVIDER,
        createdAtG: { gte: d30, lt: now },
      },
    }),

    // Reseñas 30 días previos
    prisma.review.count({
      where: {
        companyId,
        provider: PROVIDER,
        createdAtG: { gte: d60, lt: d30 },
      },
    }),
  ]);

  let totalReviews = aggAll._count._all;
  let averageRating = aggAll._avg.rating ?? 0;

  // 2) Fallback: si no hay datos en REVIEW, computar desde LOCATION
  if (totalReviews === 0) {
    const locs = await prisma.location.findMany({
      where: { companyId },
      select: { reviewsAvg: true, reviewsCount: true },
    });

    // Sumar total de reseñas y media ponderada
    let sumCount = 0;
    let sumWeighted = 0;
    for (const l of locs) {
      const cnt = l.reviewsCount ?? 0;
      const avg = l.reviewsAvg != null ? Number(l.reviewsAvg) : 0;
      if (cnt > 0) {
        sumCount += cnt;
        sumWeighted += avg * cnt;
      }
    }

    totalReviews = sumCount;
    averageRating = sumCount > 0 ? sumWeighted / sumCount : 0;
  }

  // 3) Crecimiento mensual (%)
  let monthlyGrowthPct = 0;
  if (prev30 === 0) {
    monthlyGrowthPct = last30 > 0 ? 100 : 0;
  } else {
    monthlyGrowthPct = ((last30 - prev30) / prev30) * 100;
  }

  return NextResponse.json({
    ok: true,
    metrics: {
      totalEstablishments,
      totalReviews,
      averageRating,
      last30Reviews: last30,
      prev30Reviews: prev30,
      monthlyGrowthPct,
    },
  });
}
