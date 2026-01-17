// app/server/concepts/normalization/applyMergeAspects.ts
import { prisma } from "@/app/server/db";
import { canonicalizeKey } from "../canonicalizeKey";

type AspectRow = {
  id: string;
  display_name: string;
  created_at: Date;
  usage_count: number | null;
  is_active: boolean;
};

export type AppliedMerge = {
  det_key: string;
  winner_id: string;
  loser_ids: string[];
  removed_duplicate_links: number;
  repointed_links: number;
  winner_usage_added: number;
};

export async function applyMergeAspects(limitClusters = 50): Promise<AppliedMerge[]> {
  const rows: AspectRow[] = await prisma.normalized_aspect.findMany({
    where: { is_active: true },
    select: {
      id: true,
      display_name: true,
      created_at: true,
      usage_count: true,
      is_active: true,
    },
    orderBy: { created_at: "asc" },
  });

  // group by det_key
  const groups = new Map<string, AspectRow[]>();
  for (const r of rows) {
    const det = canonicalizeKey(r.display_name);
    const bucket = groups.get(det);
    if (bucket) bucket.push(r);
    else groups.set(det, [r]);
  }

  const clusters = [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([det_key, list]) => {
      // list already sorted by created_at asc due to query + insertion order
      const winner = list[0];
      const losers = list.slice(1);
      return { det_key, winner, losers };
    })
    .sort((a, b) => b.losers.length - a.losers.length)
    .slice(0, limitClusters);

  const applied: AppliedMerge[] = [];

  for (const c of clusters) {
    const winnerId = c.winner.id;
    const loserIds = c.losers.map((x) => x.id);

    const winnerUsageAdded = c.losers.reduce((acc, x) => acc + (x.usage_count ?? 0), 0);

    // Transacción por cluster (seguro y fácil de depurar)
    const res = await prisma.$transaction(async (tx) => {
      // 1) Eliminar links duplicados: conceptos que ya tienen winner y además loser
      //    - primero buscamos concept_ids que tengan winner link
      const winnerLinks = await tx.concept_normalized_aspect.findMany({
        where: { normalized_aspect_id: winnerId },
        select: { concept_id: true },
      });
      const conceptIdsWithWinner = winnerLinks.map((x) => x.concept_id);

      let removedDup = 0;
      if (conceptIdsWithWinner.length > 0) {
        const del = await tx.concept_normalized_aspect.deleteMany({
          where: {
            normalized_aspect_id: { in: loserIds },
            concept_id: { in: conceptIdsWithWinner },
          },
        });
        removedDup = del.count;
      }

      // 2) Reapuntar links restantes loser -> winner
      const upd = await tx.concept_normalized_aspect.updateMany({
        where: { normalized_aspect_id: { in: loserIds } },
        data: { normalized_aspect_id: winnerId },
      });

      // 3) Desactivar losers para que no vuelvan a aparecer como candidatos
      await tx.normalized_aspect.updateMany({
        where: { id: { in: loserIds } },
        data: { is_active: false },
      });

      // 4) Sumar usage_count al winner (si te interesa mantener métrica)
      if (winnerUsageAdded > 0) {
        await tx.normalized_aspect.update({
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
