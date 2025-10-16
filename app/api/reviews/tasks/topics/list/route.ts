// app/api/reviews/tasks/topics/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyId   = url.searchParams.get("companyId");
    const locationId  = url.searchParams.get("locationId");
    const from        = url.searchParams.get("from"); // YYYY-MM-DD opcional
    const to          = url.searchParams.get("to");   // YYYY-MM-DD opcional
    const previewN    = Math.max(1, Math.min(20, Number(url.searchParams.get("previewN") ?? 8)));

    // ── 1) Total de reviews en el alcance (para %)
    {
      const whereParts: string[] = [];
      const params: any[] = [];
      let i = 1;

      if (companyId)  { whereParts.push(`r."companyId"  = $${i++}`); params.push(companyId); }
      if (locationId) { whereParts.push(`r."locationId" = $${i++}`); params.push(locationId); }
      if (from)       { whereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") >= $${i++}::timestamptz`); params.push(`${from}T00:00:00Z`); }
      if (to)         { whereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") <  $${i++}::timestamptz`); params.push(`${to}T00:00:00Z`); }

      const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

      const totalRows = await prisma.$queryRawUnsafe<{ n: number }[]>(
        `
          SELECT COUNT(*)::int AS n
          FROM "Review" r
          ${where}
        `,
        ...params
      );
      var totalReviews = totalRows?.[0]?.n ?? 0;
    }

    // ── 2) Resumen por topic en alcance (label, desc, estable, counts, avg_rating redondeada)
    const topicWhereParts: string[] = [`c.topic_id IS NOT NULL`];
    const topicParams: any[] = [];
    let j = 1;

    if (companyId)  { topicWhereParts.push(`r."companyId"  = $${j++}`); topicParams.push(companyId); }
    if (locationId) { topicWhereParts.push(`r."locationId" = $${j++}`); topicParams.push(locationId); }
    if (from)       { topicWhereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") >= $${j++}::timestamptz`); topicParams.push(`${from}T00:00:00Z`); }
    if (to)         { topicWhereParts.push(`COALESCE(r."createdAtG", r."ingestedAt") <  $${j++}::timestamptz`); topicParams.push(`${to}T00:00:00Z`); }

    const topicWhere = topicWhereParts.length ? `WHERE ${topicWhereParts.join(" AND ")}` : "";

    const rows = await prisma.$queryRawUnsafe<{
      id: string;
      label: string;
      description: string | null;
      is_stable: boolean;
      concepts_count: number;
      review_count: number;
      avg_rating: number | null;
    }[]>(
      `
      SELECT
        t.id::text                                          AS id,
        t.label                                             AS label,
        t.description                                       AS description,
        COALESCE(t.is_stable, false)                        AS is_stable,
        COUNT(c.*)::int                                     AS concepts_count,
        COUNT(DISTINCT c.review_id)::int                    AS review_count,
        ROUND(AVG(c.rating)::numeric, 2)::float             AS avg_rating
      FROM topic t
      JOIN concept c ON c.topic_id = t.id
      JOIN "Review" r ON r.id = c.review_id
      ${topicWhere}
      GROUP BY t.id
      ORDER BY review_count DESC, concepts_count DESC, t.label ASC
      `,
      ...topicParams
    );

    // ── 3) Añadir preview_concepts por topic (concepts bajo ese topic)
    const topics = [];
    for (const r of rows) {
      const concepts = await prisma.$queryRawUnsafe<{ id: string; label: string; avg_rating: number | null }[]>(
        `
        SELECT
          c.id::text      AS id,
          c.label         AS label,
          c.rating        AS avg_rating
        FROM concept c
        WHERE c.topic_id = $1::uuid
        ORDER BY c.updated_at DESC NULLS LAST
        LIMIT $2::int
        `,
        r.id,
        previewN
      );

      const percent = totalReviews > 0 ? r.review_count / totalReviews : 0;

      topics.push({
        id: r.id,
        label: r.label,
        description: r.description ?? null,
        is_stable: r.is_stable,
        concepts_count: r.concepts_count,
        avg_rating: r.avg_rating,
        review_count: r.review_count,
        percent,
        preview_concepts: concepts,
      });
    }

    return NextResponse.json({ ok: true, totalReviews, topics });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "list failed" }, { status: 500 });
  }
}

export const revalidate = 0;
