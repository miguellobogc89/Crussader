// app/api/reviews/tasks/concepts/normalization/aspect/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { normalizeAspectWithAI } from "@/app/server/concepts/normalization/aspects/normalizeAspect";
import { persistAspectNormalization } from "@/app/server/concepts/normalization/aspects/persistAspectNormalization";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(20, Number(searchParams.get("limit") ?? 10)));

  // 1️⃣ Concepts sin aspect normalizado
  const concepts = await prisma.concept.findMany({
    where: {
      concept_normalized_aspect: {
        none: {},
      },
    },
    take: limit,
    select: {
      id: true,
      structured: true,
    },
  });

  if (concepts.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // 2️⃣ Aspects normalizados existentes
  const existingAspects = await prisma.normalized_aspect.findMany({
    where: { is_active: true },
    select: {
      id: true,
      canonical_key: true,
      display_name: true,
      description: true,
      examples: true,
    },
  });

  let processed = 0;

  for (const c of concepts) {
    try {
      const s = c.structured as any;
      if (!s?.aspect) continue;

      const result = await normalizeAspectWithAI(
        {
          aspect: s.aspect,
          entity: s.entity ?? null,
          descriptor: s.descriptor ?? null,
        },
        existingAspects,
      );

      await persistAspectNormalization(
        c.id,
        s.aspect,
        s.entity ?? null,
        result,
      );

      processed++;
    } catch (err) {
      console.error("normalize aspect failed for concept", c.id, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
