// app/server/concepts/normalization/persistAspectNormalization.ts
import { prisma } from "@/app/server/db";
import type { NormalizeAspectResult } from "./normalizeAspect";
import { canonicalizeKey } from "../canonicalizeKey";


export async function persistAspectNormalization(
  conceptId: string,
  originalAspect: string,
  originalEntity: string | null,
  result: NormalizeAspectResult,
) {
  if (result.action === "match") {
    // 1️⃣ Enlace directo (idempotente)
    await prisma.concept_normalized_aspect.createMany({
      data: [
        {
          concept_id: conceptId,
          normalized_aspect_id: result.normalized_aspect_id,
          matched_by: "ai",
          match_confidence: result.confidence,
          original_aspect: originalAspect,
          original_entity: originalEntity,
        },
      ],
      skipDuplicates: true,
    });

    // 2️⃣ Incrementa uso
    await prisma.normalized_aspect.update({
      where: { id: result.normalized_aspect_id },
      data: {
        usage_count: { increment: 1 },
        is_active: true,
        updated_at: new Date(),
      },
    });

    return;
  }

  // ===== CREATE =====

  // 1️⃣ Upsert por canonical_key para evitar P2002
const canonicalKey = canonicalizeKey(result.display_name);

const created = await prisma.normalized_aspect.upsert({
  where: { canonical_key: canonicalKey },
  create: {
    canonical_key: canonicalKey,
    display_name: result.display_name,
    description: result.description,
    examples: result.examples,
    confidence: result.confidence,
    created_by: "ai",
    is_active: true,
    usage_count: 1,
  },
  update: {
    is_active: true,
    usage_count: { increment: 1 },
  },
});


  // 2️⃣ Crear enlace (idempotente)
  await prisma.concept_normalized_aspect.createMany({
    data: [
      {
        concept_id: conceptId,
        normalized_aspect_id: created.id,
        matched_by: "ai",
        match_confidence: result.confidence,
        original_aspect: originalAspect,
        original_entity: originalEntity,
      },
    ],
    skipDuplicates: true,
  });
}
