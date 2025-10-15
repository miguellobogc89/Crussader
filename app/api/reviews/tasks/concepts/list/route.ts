// app/api/reviews/tasks/concepts/list/route.ts
// ===================================================
// GET /api/reviews/tasks/concepts/list
// Lee directamente de la tabla concept (SQL crudo) para evitar
// el desajuste con Prisma Client mientras no hagas db pull.
// Soporta filtros opcionales ?companyId=...&locationId=...
// Devuelve { ok, concepts: [{ id, label, avg_rating, review_count }] }
//  - avg_rating = rating (última review escrita en concept)
//  - review_count = null (por compat con tu UI actual)
// ===================================================

import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

type Row = {
  id: string;
  label: string;
  sentiment: string | null;
  rating: number | null;        // columna en DB (aunque Prisma aún no la tenga)
  review_date: string | null;
  company_id: string | null;
  location_id: string | null;
  updated_at: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const locationId = searchParams.get("locationId");

    // WHERE dinámico
    let where = "1=1";
    const params: any[] = [];
    let i = 1;

    if (companyId) {
      where += ` AND c.company_id = $${i++}`;
      params.push(companyId);
    }
    if (locationId) {
      where += ` AND c.location_id = $${i++}`;
      params.push(locationId);
    }

    const sql = `
      SELECT
        c.id::text         AS id,
        c.label            AS label,
        c.sentiment        AS sentiment,
        c.rating           AS rating,
        c.review_date::text AS review_date,
        c.company_id       AS company_id,
        c.location_id      AS location_id,
        c.updated_at::text AS updated_at
      FROM concept c
      WHERE ${where}
      ORDER BY c.updated_at DESC NULLS LAST, c.label ASC
      LIMIT 1000
    `;

    const rows = await prisma.$queryRawUnsafe<Row[]>(sql, ...params);

    // Compat con la page: avg_rating = rating, review_count = null
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
      { status: 500 }
    );
  }
}
