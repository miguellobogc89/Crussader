// app/api/reviews/kpis/location/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { todayUtcStart } from "@/lib/kpis";

type Mode = "overview" | "trends";
type Granularity = "day" | "month";

function bad(status: number, msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(req: Request) {
  // ---- Auth
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return bad(401, "unauth");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return bad(400, "no_user");

  const membership = await prisma.userCompany.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
    orderBy: { createdAt: "asc" },
  });
  const defaultCompanyId = membership?.companyId ?? null;

  const { searchParams } = new URL(req.url);

  const mode = (searchParams.get("mode") as Mode) || "overview";
  const granularity = (searchParams.get("granularity") as Granularity) || "day";
  const companyId = searchParams.get("companyId") ?? defaultCompanyId ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (!companyId) return NextResponse.json({ ok: true, data: [] });

  // ------------------ MODE: OVERVIEW ------------------
  if (mode === "overview") {
    const snapshotDate = todayUtcStart();

    const kpis = await prisma.locationKpiDaily.findMany({
      where: { companyId, snapshotDate, ...(locationId ? { locationId } : {}) },
      select: {
        locationId: true,
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        answeredRate: true,
        avgAll: true,
        avg30d: true,
        prev30dAvg: true,
        responses7d: true,
        responseAvgSec: true,
        location: { select: { title: true, slug: true, status: true } },
      },
      orderBy: [{ totalReviews: "desc" }],
    });

    const rows = kpis.map((r) => ({
      locationId: r.locationId,
      title: r.location.title,
      slug: r.location.slug,
      status: r.location.status,
      totals: {
        totalReviews: r.totalReviews,
        newReviews7d: r.newReviews7d,
        newReviews30d: r.newReviews30d,
        unansweredCount: r.unansweredCount,
        responses7d: r.responses7d,
      },
      rates: {
        answeredRate: r.answeredRate,
        avgAll: r.avgAll ? Number(r.avgAll) : null,
        avg30d: r.avg30d ? Number(r.avg30d) : null,
        prev30dAvg: r.prev30dAvg ? Number(r.prev30dAvg) : null,
        responseAvgSec: r.responseAvgSec,
      },
    }));

    return NextResponse.json({ ok: true, data: rows });
  }

  // ------------------ MODE: TRENDS ------------------
  if (mode === "trends") {
    if (granularity !== "month") return bad(400, "granularity inválida; usa month");
    if (!from || !to) return bad(400, "from/to obligatorios");

    //
    // 1) BASELINE — acumulado antes del `from`
    //
    const baselineSql = `
      SELECT 
        COUNT(*) AS reviews_before,
        AVG(r.rating) AS avg_before
      FROM "Review" r
      WHERE r."createdAtG" < $1::date
        AND r."companyId" = $2
        ${locationId ? `AND r."locationId" = $3` : ""}
    `;

    const baselineParams = locationId
      ? [from, companyId, locationId]
      : [from, companyId];

    const [baselineRow] = await prisma.$queryRawUnsafe<any[]>(
      baselineSql,
      ...baselineParams
    );

    const reviewsBefore = Number(baselineRow?.reviews_before ?? 0);
    const avgBefore =
      baselineRow?.avg_before == null ? null : Number(baselineRow.avg_before);

    //
    // 2) DATA MENSUAL
    //
    const filters: string[] = [
      'r."createdAtG" IS NOT NULL',
      'r."createdAtG" >= $1::date',
      'r."createdAtG" <  $2::date',
    ];
    const params: any[] = [from, to];
    let idx = 3;

    filters.push(`r."companyId" = $${idx++}`);
    params.push(companyId);

    if (locationId) {
      filters.push(`r."locationId" = $${idx++}`);
      params.push(locationId);
    }

    const where = `WHERE ${filters.join(" AND ")}`;

    const sql = `
      SELECT to_char(date_trunc('month', r."createdAtG"), 'YYYY-MM') AS month,
             ROUND(AVG(r.rating)::numeric, 2) AS "avgRating",
             COUNT(*) AS reviews
      FROM "Review" r
      ${where}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

    const data = rows.map((x) => ({
      month: String(x.month),
      avgRating: x.avgRating === null ? null : Number(x.avgRating),
      reviews: Number(x.reviews),
    }));

    return NextResponse.json({
      ok: true,
      data,
      baseline: {
        reviewsBefore,
        avgBefore,
      },
    });
  }

  return bad(400, "mode inválido");
}
