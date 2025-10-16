// app/server/concepts/recomputeConceptMetrics.ts
// Recalcula centroid/review_count/avg_rating por concept (joins con cast).

import { prisma } from "../db";
import { toPgVectorLiteral } from "../embeddings";

type Vec = number[];

function parsePgVectorText(s: string): Vec {
  const inner = s.trim().replace(/^[\[\(]\s*|\s*[\]\)]$/g, "");
  if (!inner) return [];
  return inner.split(",").map((x) => parseFloat(x.trim())).filter(Number.isFinite);
}

function meanVector(vectors: Vec[]): Vec {
  if (!vectors.length) return [];
  const dim = vectors[0].length;
  const acc = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) acc[i] += v[i] || 0;
  for (let i = 0; i < dim; i++) acc[i] /= vectors.length;
  return acc;
}

export async function recomputeConceptMetrics(limitConcepts = 200) {
  const concepts = await prisma.concept.findMany({
    select: { id: true },
    take: limitConcepts,
    orderBy: { updated_at: "desc" },
  });

  let updated = 0;

  for (const c of concepts) {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ rating: number | null; vector_text: string | null }>
    >(
      `
      SELECT rci.rating::int AS rating,
             re.vector::text AS vector_text
      FROM review_concept rc
      JOIN review_concept_input rci
        ON rci.id::uuid = rc.review_id                     -- 👈 cast explícito
      LEFT JOIN review_embedding re
        ON re.review_id = rci.id::uuid                     -- 👈 cast explícito
      WHERE rc.concept_id = $1::uuid                       -- 👈 cast explícito
      `,
      c.id
    );

    if (!rows?.length) {
      await prisma.concept.update({
        where: { id: c.id },
        data: { updated_at: new Date() },
      });
      updated++;
      continue;
    }

    const ratings: number[] = [];
    const vectors: Vec[] = [];

    for (const r of rows) {
      if (typeof r.rating === "number") ratings.push(r.rating);
      if (r.vector_text) {
        const v = parsePgVectorText(r.vector_text);
        if (v.length) vectors.push(v);
      }
    }

    const count = rows.length;
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    if (vectors.length) {
      const centroid = meanVector(vectors);
      const centroidLit = toPgVectorLiteral(centroid);
      await prisma.$executeRawUnsafe(
        `
        UPDATE concept
        SET centroid = ${centroidLit},
            review_count = $1,
            avg_rating = $2,
            updated_at = now()
        WHERE id = $3::uuid
        `,
        count,
        avg,
        c.id
      );
    } else {
      await prisma.concept.update({
        where: { id: c.id },
        data: { updated_at: new Date() },
      });
    }

    updated++;
  }

  return { conceptsScanned: concepts.length, updated };
}
