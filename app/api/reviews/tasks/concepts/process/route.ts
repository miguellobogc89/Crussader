import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { extractConceptsFromReview } from "@/app/server/concepts/extractConcepts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

  if (!locationId) {
    return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });
  }

  // Reviews pendientes con texto
  const reviews = await prisma.$queryRaw<Array<{
    id: string; comment: string | null; rating: number | null; createdAtG: Date | null; ingestedAt: Date;
  }>>`
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
    return NextResponse.json({ ok: true, processed: 0, insertedConcepts: 0 });
  }

  let insertedConcepts = 0;

  for (const r of reviews) {
    try {
      const text = (r.comment ?? "").trim();
      let batchData: any[] = [];

      if (text) {
        const concepts = await extractConceptsFromReview(text);
        if (concepts?.length) {
          const reviewDate = (r.createdAtG ?? r.ingestedAt) ?? null;
          const rating =
            Number.isFinite(r.rating) ? Math.max(0, Math.min(5, Math.round(r.rating!))) : null;

          batchData = concepts.map((c) => ({
            label: c.label,
            model: "gpt-4o-mini",     // o el que prefieras registrar
            review_id: r.id,
            sentiment: c.sentiment ?? null,
            confidence: typeof c.confidence === "number" ? c.confidence : null,
            relevance: 1,
            rating,
            review_date: reviewDate,
          }));
        }
      }

      if (batchData.length) {
        const res = await prisma.concept.createMany({ data: batchData });
        insertedConcepts += res.count;
      }
    } catch (err) {
      // sigue con la siguiente review, pero no bloquees el batch
      console.error("Error procesando review", r.id, err);
    } finally {
      // marque o no conceptos, no reintentar esta review
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
