// app/server/concepts/normalization/entity/applyMergeEntities.ts
import { prisma } from "@/app/server/db";
import { canonicalizeKey } from "../canonicalizeKey";

type EntityRow = {
  id: string;
  display_name: string;
  created_at: Date;
  usage_count: number | null;
};

export type AppliedEntityMerge = {
  det_key: string;
  winner_id: string;
  loser_ids: string[];
  removed_duplicate_links: number;
  repointed_links: number;
  winner_usage_added: number;
};

export async function applyMergeEntities(
  limitClusters = 50,
): Promise<AppliedEntityMerge[]> {
  const rows: EntityRow[] = await prisma.normalized_entity.findMany({
    where: { is_active: true },
    select: {
      id: true,
      display_name: true,
      created_at: true,
      usage_count: true,
    },
    orderBy: { created_at: "asc" },
  });

  // group by det_key
  const groups = new Map<string, EntityRow[]>();
  for (const r of rows) {
    const det = canonicalizeKey(r.display_name);
    const bucket = groups.get(det);
    if (bucket) bucket.push(r);
    else groups.set(det, [r]);
  }

  const clusters = [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([det_key, list]) => ({
      det_key,
      winner: list[0],
      losers: list.slice(1),
    }))
    .sort((a, b) => b.losers.length - a.losers.length)
    .slice(0, limitClusters);

  const applied: AppliedEntityMerge[] = [];

  for (const c of clusters) {
    const winnerId = c.winner.id;
    const loserIds = c.losers.map((x) => x.id);
    const winnerUsageAdded = c.losers.reduce(
      (acc, x) => acc + (x.usage_count ?? 0),
      0,
    );

    const res = await prisma.$transaction(async (tx) => {
      // 1) eliminar duplicados (concepts que ya tenían winner)
      const winnerLinks = await tx.concept_normalized_entity.findMany({
        where: { normalized_entity_id: winnerId },
        select: { concept_id: true },
      });

      const conceptIdsWithWinner = winnerLinks.map((x) => x.concept_id);

      let removedDup = 0;
      if (conceptIdsWithWinner.length > 0) {
        const del = await tx.concept_normalized_entity.deleteMany({
          where: {
            normalized_entity_id: { in: loserIds },
            concept_id: { in: conceptIdsWithWinner },
          },
        });
        removedDup = del.count;
      }

      // 2) reapuntar losers → winner
      const upd = await tx.concept_normalized_entity.updateMany({
        where: { normalized_entity_id: { in: loserIds } },
        data: { normalized_entity_id: winnerId },
      });

      // 3) desactivar losers
      await tx.normalized_entity.updateMany({
        where: { id: { in: loserIds } },
        data: { is_active: false },
      });

      // 4) sumar usage_count
      if (winnerUsageAdded > 0) {
        await tx.normalized_entity.update({
          where: { id: winnerId },
          data: { usage_count: { increment: winnerUsageAdded } },
        });
      }

      return { removedDup, repointed: upd.count };
    });

    applied.push({
      det_key: c.det_key,
      winner_id: winnerId,
      loser_ids: loserIds,
      removed_duplicate_links: res.removedDup,
      repointed_links: res.repointed,
      winner_usage_added: winnerUsageAdded,
    });
  }

  return applied;
}
