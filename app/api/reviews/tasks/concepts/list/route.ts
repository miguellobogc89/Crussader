// app/api/reviews/tasks/concepts/list/route.ts
// ===================================================
// GET /api/reviews/tasks/concepts/list
// Lista concepts filtrando por company/location a través de Review,
// NO por columnas company_id/location_id del propio concept (que están a NULL).
// Soporta ?companyId=...&locationId=...
// Devuelve { ok, concepts: [{ id, label, avg_rating, review_count }] }
// ===================================================

import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

type Row = {
  id: string;
  label: string;
  sentiment: string | null;
  rating: number | null;
  review_date: string | null;
  updated_at: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const locationId = searchParams.get("locationId");

    // WHERE dinámico sobre Review
    let where = "1=1";
    const params: any[] = [];
    let i = 1;

    if (companyId) {
      where += ` AND r."companyId" = $${i++}`;
      params.push(companyId);
    }
    if (locationId) {
      where += ` AND r."locationId" = $${i++}`;
      params.push(locationId);
    }

    const sql = `
      SELECT
        c.id::text          AS id,
        c.label             AS label,
        c.sentiment         AS sentiment,
        c.rating            AS rating,
        c.review_date::text AS review_date,
        c.updated_at::text  AS updated_at
      FROM concept c
      JOIN "Review" r ON r.id = c.review_id
      WHERE ${where}
      ORDER BY c.updated_at DESC NULLS LAST, c.label ASC
      LIMIT 1000
    `;

    const rows = await prisma.$queryRawUnsafe<Row[]>(sql, ...params);

    const concepts = rows.map((r) => ({
      id: r.id,
      label: r.label,
      avg_rating: typeof r.rating === "number" ? r.rating : null,
      review_count: null,
    }));

    return NextResponse.json({ ok: true, concepts });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "No se pudo listar concepts" },
      { status: 500 },
    );
  }
}
