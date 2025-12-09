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
  if (!email) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
  }

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

  if (!companyId) {
    return NextResponse.json({ ok: true, data: [] });
  }
  if (!from || !to) {
    return NextResponse.json(
      { ok: false, error: "Missing from/to (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  // ──────────────────────────────────────────────
  // Review + primera Response publicada (published = true)
  // ──────────────────────────────────────────────
  const filters = [
    `r."companyId" = $1`,
    `r."createdAtG" IS NOT NULL`,
    `r."createdAtG" >= $2::date`,
    `r."createdAtG" <  $3::date`,
  ];
  const params: any[] = [companyId, from, to];
  let idx = 4;

  if (locationId) {
    filters.push(`r."locationId" = $${idx++}`);
    params.push(locationId);
  }

  const sql = `
    WITH resp_pub AS (
      SELECT
        "reviewId",
        MIN("publishedAt") AS "firstPublishedAt"
      FROM "Response"
      WHERE "published" = true
      GROUP BY "reviewId"
    )
    SELECT
      to_char(date_trunc('month', r."createdAtG"), 'YYYY-MM') AS month,
      r."locationId",
      COUNT(*)::int AS "reviewsCount",
      AVG(r."rating")::float        AS "avgRating",
      SUM(CASE WHEN r."responded" THEN 1 ELSE 0 END)::int AS "answeredCount",

      -- conteos por estrella
      SUM(CASE WHEN r."rating" = 1 THEN 1 ELSE 0 END)::int AS "star1Count",
      SUM(CASE WHEN r."rating" = 2 THEN 1 ELSE 0 END)::int AS "star2Count",
      SUM(CASE WHEN r."rating" = 3 THEN 1 ELSE 0 END)::int AS "star3Count",
      SUM(CASE WHEN r."rating" = 4 THEN 1 ELSE 0 END)::int AS "star4Count",
      SUM(CASE WHEN r."rating" = 5 THEN 1 ELSE 0 END)::int AS "star5Count",

      -- solo reseñas con alguna respuesta publicada
      COUNT(resp_pub."firstPublishedAt")::int AS "answeredPubCount",
      AVG(
        CASE
          WHEN resp_pub."firstPublishedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (resp_pub."firstPublishedAt" - r."createdAtG"))
          ELSE NULL
        END
      )::float AS "avgResponseDelaySec",

      -- responded por estrella (para answeredByStarPct)
      SUM(CASE WHEN r."rating" = 1 AND r."responded" THEN 1 ELSE 0 END)::int AS "answeredStar1Count",
      SUM(CASE WHEN r."rating" = 2 AND r."responded" THEN 1 ELSE 0 END)::int AS "answeredStar2Count",
      SUM(CASE WHEN r."rating" = 3 AND r."responded" THEN 1 ELSE 0 END)::int AS "answeredStar3Count",
      SUM(CASE WHEN r."rating" = 4 AND r."responded" THEN 1 ELSE 0 END)::int AS "answeredStar4Count",
      SUM(CASE WHEN r."rating" = 5 AND r."responded" THEN 1 ELSE 0 END)::int AS "answeredStar5Count"
    FROM "Review" r
    LEFT JOIN resp_pub ON resp_pub."reviewId" = r."id"
    WHERE ${filters.join(" AND ")}
    GROUP BY date_trunc('month', r."createdAtG"), r."locationId"
    ORDER BY date_trunc('month', r."createdAtG") ASC, r."locationId" ASC
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

  const data = rows.map((r) => {
    const total = Number(r.reviewsCount) || 0;

    const stars = {
      1: Number(r.star1Count) || 0,
      2: Number(r.star2Count) || 0,
      3: Number(r.star3Count) || 0,
      4: Number(r.star4Count) || 0,
      5: Number(r.star5Count) || 0,
    };

    const answeredCount = Number(r.answeredCount) || 0;
    const answeredPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

    const answeredByStarAbs = {
      1: Number(r.answeredStar1Count) || 0,
      2: Number(r.answeredStar2Count) || 0,
      3: Number(r.answeredStar3Count) || 0,
      4: Number(r.answeredStar4Count) || 0,
      5: Number(r.answeredStar5Count) || 0,
    };

    const answeredByStarPct = Object.fromEntries(
      Object.keys(stars).map((key) => {
        const k = Number(key) as 1 | 2 | 3 | 4 | 5;
        const totalStar = stars[k] || 0;
        const answeredStar = answeredByStarAbs[k] || 0;
        const pct = totalStar > 0 ? Math.round((answeredStar / totalStar) * 100) : 0;
        return [k, pct];
      })
    );

    const avgResponseDelaySec =
      r.avgResponseDelaySec == null ? null : Number(r.avgResponseDelaySec);
    const answeredPubCount = Number(r.answeredPubCount) || 0;

    return {
      month: String(r.month),
      locationId: r.locationId as string,
      reviewsCount: total,
      avgRating: r.avgRating == null ? null : Number(r.avgRating),
      answeredCount,
      answeredPct,
      stars,
      answeredByStarPct,
      avgResponseDelaySec, // segundos
      answeredPubCount,
    };
  });

  // ──────────────────────────────────────────────
  // Global: tiempo medio de respuesta de la compañía
  // ──────────────────────────────────────────────
  const globalSql = `
    WITH resp_pub AS (
      SELECT
        "reviewId",
        MIN("publishedAt") AS "firstPublishedAt"
      FROM "Response"
      WHERE "published" = true
      GROUP BY "reviewId"
    )
    SELECT
      AVG(
        EXTRACT(EPOCH FROM (resp_pub."firstPublishedAt" - r."createdAtG"))
      )::float AS "avgResponseDelaySec",
      COUNT(resp_pub."firstPublishedAt")::int AS "answeredPubCount"
    FROM "Review" r
    LEFT JOIN resp_pub ON resp_pub."reviewId" = r."id"
    WHERE r."companyId" = $1
      AND r."createdAtG" IS NOT NULL
      AND resp_pub."firstPublishedAt" IS NOT NULL
  `;

  const globalRows = await prisma.$queryRawUnsafe<any[]>(globalSql, companyId);
  const g = globalRows[0] ?? null;

  const global = g
    ? {
        avgResponseDelaySec:
          g.avgResponseDelaySec == null ? null : Number(g.avgResponseDelaySec),
        answeredPubCount: Number(g.answeredPubCount) || 0,
      }
    : {
        avgResponseDelaySec: null,
        answeredPubCount: 0,
      };

  return NextResponse.json({ ok: true, data, global });
}
