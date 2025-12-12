// app/api/reviews/topics/top/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const revalidate = 0;

function clampInt(n: number, min: number, max: number) {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const locationId = (url.searchParams.get("locationId") ?? "").trim();
    if (!locationId) {
      return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });
    }

    const limit = clampInt(Number(url.searchParams.get("limit") ?? 5), 1, 20);

    const from = (url.searchParams.get("from") ?? "").trim(); // YYYY-MM-DD opcional
    const to = (url.searchParams.get("to") ?? "").trim();     // YYYY-MM-DD opcional

    const whereParts: string[] = [
      `c.topic_id IS NOT NULL`,
      `r."locationId" = $1`,
    ];
    const params: any[] = [locationId];
    let i = 2;

    if (from) {
      whereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") >= $${i++}::timestamptz`);
      params.push(`${from}T00:00:00Z`);
    }
    if (to) {
      whereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") <  $${i++}::timestamptz`);
      params.push(`${to}T00:00:00Z`);
    }

    const where = `WHERE ${whereParts.join(" AND ")}`;

    const rows = await prisma.$queryRawUnsafe<
      {
        id: string;
        label: string;
        description: string | null;
        is_stable: boolean;
        review_count: number;
        concepts_count: number;
        avg_rating: number | null;
      }[]
    >(
      `
      SELECT
        t.id::text                                AS id,
        t.label                                   AS label,
        t.description                             AS description,
        COALESCE(t.is_stable, false)              AS is_stable,
        COUNT(DISTINCT c.review_id)::int          AS review_count,
        COUNT(DISTINCT c.id)::int                 AS concepts_count,
        ROUND(AVG(c.rating)::numeric, 2)::float   AS avg_rating
      FROM topic t
      JOIN concept c ON c.topic_id = t.id
      JOIN "Review" r ON r.id = c.review_id
      ${where}
      GROUP BY t.id
      ORDER BY review_count DESC, concepts_count DESC, t.label ASC
      LIMIT $${i}::int
      `,
      ...params,
      limit
    );

    return NextResponse.json({ ok: true, topics: rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "topics/top failed" },
      { status: 500 }
    );
  }
}
