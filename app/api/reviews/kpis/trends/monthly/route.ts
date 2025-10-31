// app/api/reviews/kpis/trends/monthly/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });

  const membership = await prisma.userCompany.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
    orderBy: { createdAt: "asc" },
  });
  const defaultCompanyId = membership?.companyId ?? null;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId") ?? defaultCompanyId ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;
  const from = searchParams.get("from")!;
  const to = searchParams.get("to")!;

  if (!companyId) return NextResponse.json({ ok: true, data: [] });
  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Missing from/to (YYYY-MM-DD)" }, { status: 400 });
  }

  const filters = [
    `"companyId" = $1`,
    `"monthDate" >= $2::date`,
    `"monthDate" <  $3::date`,
  ];
  const params: any[] = [companyId, from, to];
  let idx = 4;

  if (locationId) { filters.push(`"locationId" = $${idx++}`); params.push(locationId); }

  const sql = `
    SELECT
      to_char("monthDate", 'YYYY-MM') AS month,
      "locationId",
      "reviewsCount",
      "avgRating",
      "answeredCount",
      "star1Count","star2Count","star3Count","star4Count","star5Count",
      "answeredByStar"
    FROM "LocationReviewMonthly"
    WHERE ${filters.join(" AND ")}
    ORDER BY "monthDate" ASC, "locationId" ASC
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

  const data = rows.map(r => {
    const total = Number(r.reviewsCount) || 0;
    const stars = {
      1: Number(r.star1Count) || 0,
      2: Number(r.star2Count) || 0,
      3: Number(r.star3Count) || 0,
      4: Number(r.star4Count) || 0,
      5: Number(r.star5Count) || 0,
    };
    const answeredPct = total > 0 ? Math.round((Number(r.answeredCount) / total) * 100) : 0;

    // answeredByStar% (si lo necesitas)
    const absAnsweredByStar = r.answeredByStar ?? {};
    const answeredByStarPct = Object.fromEntries(
      Object.entries(stars).map(([k, v]) => {
        const answeredAbs = Number(absAnsweredByStar[k] ?? 0);
        return [k, v > 0 ? Math.round((answeredAbs / Number(v)) * 100) : 0];
      })
    );

    return {
      month: String(r.month),
      locationId: r.locationId as string,
      reviewsCount: total,
      avgRating: r.avgRating === null ? null : Number(r.avgRating),
      answeredCount: Number(r.answeredCount) || 0,
      answeredPct,
      stars,
      answeredByStarPct,
    };
  });

  return NextResponse.json({ ok: true, data });
}
