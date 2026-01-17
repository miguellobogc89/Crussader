// app/server/concepts/normalization/entity/resolveEntityCanonicalKey.ts
import { prisma } from "@/app/server/db";

export async function resolveEntityCanonicalKey(canonicalKey: string): Promise<string> {
  const key = String(canonicalKey ?? "").trim();
  if (!key) return "";

  const row = await prisma.normalized_entity_alias.findUnique({
    where: { loser_canonical_key: key },
    select: { winner_canonical_key: true },
  });

  if (row?.winner_canonical_key) return row.winner_canonical_key;
  return key;
}

