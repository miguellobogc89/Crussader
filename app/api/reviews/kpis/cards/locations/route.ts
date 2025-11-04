// app/api/reviews/kpis/cards/locations/rating/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function bad(status: number, msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(req: Request) {
  try {
    // ---- Auth
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) return bad(401, "unauth");

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return bad(400, "no_user");

    // ---- Empresa activa (primera relación)
    const membership = await prisma.userCompany.findFirst({
      where: { userId: user.id },
      select: { companyId: true },
      orderBy: { createdAt: "asc" },
    });
    const companyId = membership?.companyId ?? null;
    if (!companyId) return bad(400, "no_company");

    // ---- Params
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    if (!locationId) return bad(400, "locationId_required");

    // ---- Verifica que la location pertenece a la empresa del usuario
    const loc = await prisma.location.findFirst({
      where: { id: locationId, companyId },
      select: { id: true, companyId: true, reviewsAvg: true, reviewsCount: true },
    });
    if (!loc) return bad(404, "location_not_found_or_not_in_company");

    // ---- 1) location_stats
    const stats = await prisma.location_stats.findUnique({
      where: { location_id: locationId },
      select: { avg_rating: true, reviews_count: true },
    });

    if (stats?.avg_rating !== null && stats?.avg_rating !== undefined) {
      return NextResponse.json({
        ok: true,
        data: {
          locationId,
          rating: Number(stats.avg_rating),
          reviewsCount: stats.reviews_count ?? loc.reviewsCount ?? 0,
          source: "location_stats",
        },
      });
    }

    // ---- 2) Location.reviewsAvg
    if (loc.reviewsAvg !== null && loc.reviewsAvg !== undefined) {
      return NextResponse.json({
        ok: true,
        data: {
          locationId,
          rating: Number(loc.reviewsAvg),
          reviewsCount: loc.reviewsCount ?? 0,
          source: "location.reviewsAvg",
        },
      });
    }

    // ---- 3) Cálculo desde Review (avg y count)
    const agg = await prisma.review.aggregate({
      where: { locationId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const avg = agg._avg.rating ?? null;
    const count = agg._count._all ?? 0;

    return NextResponse.json({
      ok: true,
      data: {
        locationId,
        rating: avg === null ? null : Number(avg.toFixed(2)),
        reviewsCount: count,
        source: "reviews_aggregate",
      },
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message ?? "location_rating_failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
