// app/server/concepts/normalization/entity/persistEntityNormalization.ts
import { prisma } from "@/app/server/db";
import type { NormalizeEntityResult } from "./normalizeEntity";
import { resolveEntityCanonicalKey } from "./resolveEntityCanonicalKey";

export async function persistEntityNormalization(
  conceptId: string,
  originalEntity: string,
  originalAspect: string | null,
  result: NormalizeEntityResult,
) {
  if (result.action === "match") {
    await prisma.concept_normalized_entity.createMany({
      data: [
        {
          concept_id: conceptId,
          normalized_entity_id: result.normalized_entity_id,
          matched_by: "ai",
          match_confidence: result.confidence,
          original_entity: originalEntity,
          original_aspect: originalAspect,
        },
      ],
      skipDuplicates: true,
    });

    await prisma.normalized_entity.update({
      where: { id: result.normalized_entity_id },
      data: {
        usage_count: { increment: 1 },
        is_active: true,
        updated_at: new Date(),
      },
    });

    return;
  }

  // ===== CREATE =====

  // 1️⃣ Upsert por canonical_key (y alias lookup)
  const canonicalKey = await resolveEntityCanonicalKey(result.canonical_key);

  const created = await prisma.normalized_entity.upsert({
    where: { canonical_key: canonicalKey },
    create: {
      canonical_key: canonicalKey,
      display_name: result.display_name,
      description: result.description,
      examples: result.examples ?? [],
      confidence: result.confidence,
      created_by: "ai",
      is_active: true,
      usage_count: 1,
    },
    update: {
      is_active: true,
      usage_count: { increment: 1 },
      updated_at: new Date(),
      examples: { push: result.examples ?? [] },
    },
  });

  // 2️⃣ Crear enlace (idempotente)
  await prisma.concept_normalized_entity.createMany({
    data: [
      {
        concept_id: conceptId,
        normalized_entity_id: created.id,
        matched_by: "ai",
        match_confidence: result.confidence,
        original_entity: originalEntity,
        original_aspect: originalAspect,
      },
    ],
    skipDuplicates: true,
  });
}

