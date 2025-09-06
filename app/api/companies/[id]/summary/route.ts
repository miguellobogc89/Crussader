// app/api/companies/[id]/summary/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, ReviewProvider } from "@prisma/client";

const prisma = new PrismaClient();
const PROVIDER = ReviewProvider.GOOGLE; // ajusta si usas otro

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 14: params es Promise
) {
  const { id: companyId } = await ctx.params;

  // Ventanas de tiempo para crecimiento (últimos 30 vs 30 previos)
  const now = new Date();
  const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);

  const [totalEstablishments, aggAll, last30, prev30] = await Promise.all([
    prisma.location.count({ where: { companyId } }),
    prisma.review.aggregate({
      where: { companyId, provider: PROVIDER },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.count({
      where: { companyId, provider: PROVIDER, createdAtG: { gte: d30, lt: now } },
    }),
    prisma.review.count({
      where: { companyId, provider: PROVIDER, createdAtG: { gte: d60, lt: d30 } },
    }),
  ]);

  const totalReviews = aggAll._count._all;
  const averageRating = aggAll._avg.rating ?? 0;

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
