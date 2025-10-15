// app/api/reviews/tasks/concepts/recompute-metrics/route.ts
// ===================================================
// Recalcula métricas de concept con soporte a ambos esquemas:
// - review (minúscula, id uuid)
// - "Review" (mayúscula, id text/cuid)
// ===================================================

import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const run = url.searchParams.get("run");

  if (!run) {
    return NextResponse.json({
      ok: true,
      hint: "Añade ?run=1 para ejecutar el recálculo.",
      example: "/api/reviews/tasks/concepts/recompute-metrics?run=1",
    });
  }

  try {
    // 1) Reset
    await prisma.$executeRawUnsafe(`
      UPDATE concept
      SET review_count = 0,
          avg_rating   = 0,
          updated_at   = now()
    `);

    // 2) Recuento con review_concept (siempre funciona)
    const updatedCounts = Number(
      await prisma.$executeRawUnsafe(`
        WITH agg AS (
          SELECT concept_id, COUNT(*)::int AS review_count
          FROM review_concept
          GROUP BY concept_id
        )
        UPDATE concept c
        SET review_count = agg.review_count,
            updated_at   = now()
        FROM agg
        WHERE c.id = agg.concept_id
      `)
    ) || 0;

    // 3) avg_rating: intentar con review (minúscula, uuid)
    let updatedAverages = 0;
    let note: string | undefined;

    try {
      updatedAverages = Number(
        await prisma.$executeRawUnsafe(`
          WITH agg AS (
            SELECT rc.concept_id, AVG(r.rating)::float AS avg_rating
            FROM review_concept rc
            JOIN review r ON r.id = rc.review_id  -- ambos uuid
            GROUP BY rc.concept_id
          )
          UPDATE concept c
          SET avg_rating = COALESCE(agg.avg_rating, 0),
              updated_at = now()
          FROM agg
          WHERE c.id = agg.concept_id
        `)
      ) || 0;
      // si llegó aquí, ya está
    } catch (eMin: any) {
      // 4) si no existe review (minúscula), probar con "Review" (mayúscula, text)
      try {
        updatedAverages = Number(
          await prisma.$executeRawUnsafe(`
            WITH agg AS (
              SELECT rc.concept_id, AVG(r."rating")::float AS avg_rating
              FROM review_concept rc
              JOIN "Review" r ON r.id = rc.review_id::text  -- cast uuid->text
              GROUP BY rc.concept_id
            )
            UPDATE concept c
            SET avg_rating = COALESCE(agg.avg_rating, 0),
                updated_at = now()
            FROM agg
            WHERE c.id = agg.concept_id
          `)
        ) || 0;

        if (updatedAverages === 0) {
          note = 'Se usó "Review" (id text) pero no hubo coincidencias con review_concept (ids distintos).';
        }
      } catch (eMay: any) {
        note =
          'No se encontró "review" (minúscula) ni fue posible usar "Review" (mayúscula). avg_rating permanece en 0.';
      }
    }

    return NextResponse.json({
      ok: true,
      updatedCounts,
      updatedAverages,
      note,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "recompute failed" },
      { status: 500 }
    );
  }
}
