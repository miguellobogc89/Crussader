// app/api/reviews/tasks/concepts/process/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import {
  extractConceptsFromReview,
  type ExtractedConcept,
} from "@/app/server/concepts/extractConcepts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const limit = Math.max(
    1,
    Math.min(200, Number(searchParams.get("limit") ?? 50)),
  );

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId requerido" },
      { status: 400 },
    );
  }

  // 🔹 Contexto del negocio (una sola consulta)
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      title: true,
      type: {
        select: {
          name: true,
          activity: { select: { name: true } },
        },
      },
    },
  });

  const businessName = loc?.title ?? null;
  const businessType = loc?.type?.name ?? null;
  const activityName = loc?.type?.activity?.name ?? null;

  // 🔹 Reviews pendientes con texto (las que define el contador de "pendientes")
  const reviews = await prisma.$queryRaw<
    {
      id: string;
      comment: string | null;
      rating: number | null;
      createdAtG: Date | null;
      ingestedAt: Date;
    }[]
  >`
    SELECT r.id::text, r.comment, r.rating, r."createdAtG", r."ingestedAt"
    FROM "Review" r
    WHERE r."locationId" = ${locationId}
      AND COALESCE(r."isTest", false) = false
      AND COALESCE(r.is_conceptualized, false) = false
      AND COALESCE(NULLIF(TRIM(r.comment), ''), NULL) IS NOT NULL
    ORDER BY r."createdAtG" NULLS LAST, r."ingestedAt" ASC
    LIMIT ${limit}
  `;

  if (reviews.length === 0) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      insertedConcepts: 0,
    });
  }

  let insertedConcepts = 0;

  for (const r of reviews) {
    try {
      const text = (r.comment ?? "").trim();
      let batchData: any[] = [];

      if (text) {
        // 🔹 Extraemos conceptos estructurados
        const concepts = await extractConceptsFromReview(text, {
          businessName,
          businessType,
          activityName,
        });

        if (concepts && concepts.length > 0) {
          const reviewDate = (r.createdAtG ?? r.ingestedAt) ?? null;
          const rating =
            Number.isFinite(r.rating)
              ? Math.max(0, Math.min(5, Math.round(r.rating!)))
              : null;

          // 🔹 Mapeamos el modelo estructurado a tu tabla actual
          batchData = concepts.map((c: ExtractedConcept) => ({
            label: c.summary,                    // 👈 usamos SOLO summary
            model: "gpt-4o-mini",
            review_id: r.id,
            sentiment: c.judgment,               // mismo campo que antes
            confidence:
              typeof c.intensity === "number"    // usamos intensity como antes
                ? c.intensity
                : typeof c.confidence === "number"
                  ? c.confidence
                  : null,
            relevance: 1,
            rating,
            review_date: reviewDate,

            // 🔥 Nuevo: payload estructurado completo
            structured: {
              entity: c.entity,
              aspect: c.aspect,
              judgment: c.judgment,
              intensity: c.intensity,
              descriptor: c.descriptor ?? null,
              category: c.category,
              summary: c.summary,
            },
          }));
        }
      }

      if (batchData.length) {
        const res = await prisma.concept.createMany({ data: batchData });
        insertedConcepts += res.count;
      }
    } catch (err) {
      console.error("Error procesando review", r.id, err);
    } finally {
      // 💡 Importante: se marque o no conceptos, esta review ya no se reintenta
      await prisma.$executeRaw`
        UPDATE "Review"
        SET is_conceptualized = true, "updatedAt" = now()
        WHERE id = ${r.id}
      `;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: reviews.length,
    insertedConcepts,
  });
}
