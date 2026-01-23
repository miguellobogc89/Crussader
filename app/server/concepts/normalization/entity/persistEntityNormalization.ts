// app/server/concepts/normalization/entity/persistEntityNormalization.ts
import { prisma } from "@/app/server/db";
import type { NormalizeEntityResult } from "./normalizeEntity";
import { resolveEntityCanonicalKey } from "./resolveEntityCanonicalKey";

const NORMALIZATION_VERSION = "v1";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function persistEntityNormalization(
  conceptId: string,
  originalEntity: string,
  originalAspect: string | null,
  result: NormalizeEntityResult,
) {
  await prisma.$transaction(async (tx) => {
    let normalizedEntityId: string;

    if (result.action === "match") {
      normalizedEntityId = result.normalized_entity_id;

      if (!isUuid(normalizedEntityId)) {
        throw new Error(
          `[persistEntityNormalization] normalizeEntity returned non-UUID normalized_entity_id="${normalizedEntityId}". Result=${JSON.stringify(result)}`
        );
      }

      await tx.concept_normalized_entity.createMany({
        data: [
          {
            concept_id: conceptId,
            normalized_entity_id: normalizedEntityId,
            matched_by: "ai",
            match_confidence: result.confidence,
            original_entity: originalEntity,
            original_aspect: originalAspect,
          },
        ],
        skipDuplicates: true,
      });

      await tx.normalized_entity.update({
        where: { id: normalizedEntityId },
        data: {
          usage_count: { increment: 1 },
          is_active: true,
          updated_at: new Date(),
        },
      });
    } else {
      // ===== CREATE =====
      const canonicalKey = await resolveEntityCanonicalKey(result.canonical_key);

      const created = await tx.normalized_entity.upsert({
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

      normalizedEntityId = created.id;

      await tx.concept_normalized_entity.createMany({
        data: [
          {
            concept_id: conceptId,
            normalized_entity_id: normalizedEntityId,
            matched_by: "ai",
            match_confidence: result.confidence,
            original_entity: originalEntity,
            original_aspect: originalAspect,
          },
        ],
        skipDuplicates: true,
      });
    }

    // Cache en concept (idempotente). NO tocamos normalized_at aquí.
    await tx.concept.update({
      where: { id: conceptId },
      data: {
        normalized_entity_id: normalizedEntityId,
        normalization_version: NORMALIZATION_VERSION,
      },
    });
  });
}
