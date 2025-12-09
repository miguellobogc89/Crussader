import { NextResponse } from "next/server";
import { PrismaClient, ReviewProvider, Role } from "@prisma/client";

const prisma = new PrismaClient();
const PROVIDER = ReviewProvider.GOOGLE;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await ctx.params;

  const now = new Date();
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now);
  d60.setDate(d60.getDate() - 60);

  const [totalEstablishments, aggAll, last30, prev30, totalUsers] =
    await Promise.all([
      // ✅ ESTO: solo contar locations de la company
      prisma.location.count({
        where: { companyId },
      }),

      prisma.review.aggregate({
        where: { companyId, provider: PROVIDER },
        _avg: { rating: true },
        _count: { _all: true },
      }),

      prisma.review.count({
        where: {
          companyId,
          provider: PROVIDER,
          createdAtG: { gte: d30, lt: now },
        },
      }),

      prisma.review.count({
        where: {
          companyId,
          provider: PROVIDER,
          createdAtG: { gte: d60, lt: d30 },
        },
      }),

      // ✅ AQUÍ SÍ excluimos system_admin
      prisma.userCompany.count({
        where: {
          companyId,
          User: {
            role: {
              not: Role.system_admin,
            },
          },
        },
      }),
    ]);

  let totalReviews = aggAll._count._all;
  let averageRating = aggAll._avg.rating ?? 0;

  if (totalReviews === 0) {
    const locs = await prisma.location.findMany({
      where: { companyId },
      select: { reviewsAvg: true, reviewsCount: true },
    });

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
      totalUsers, // 👈 ya sin system_admin
    },
  });
}
