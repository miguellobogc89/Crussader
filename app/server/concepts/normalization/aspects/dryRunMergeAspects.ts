import { prisma } from "@/app/server/db";
import { canonicalizeKey } from "../canonicalizeKey";

export type MergeCluster = {
  det_key: string;
  winner: { id: string; display_name: string; created_at: Date; usage_count: number | null };
  losers: { id: string; display_name: string; created_at: Date; usage_count: number | null }[];
};

export async function dryRunMergeAspects(limitClusters = 50): Promise<MergeCluster[]> {
  const rows = await prisma.normalized_aspect.findMany({
    where: { is_active: true },
    select: { id: true, display_name: true, created_at: true, usage_count: true },
    orderBy: { created_at: "asc" },
  });

  const groups = new Map<string, typeof rows>();

  for (const r of rows) {
    const det = canonicalizeKey(r.display_name);
    const bucket = groups.get(det);
    if (bucket) {
      bucket.push(r);
    } else {
      groups.set(det, [r]);
    }
  }

  const clusters: MergeCluster[] = [];

  for (const [det_key, list] of groups.entries()) {
    if (list.length <= 1) continue;

    // ya viene ordenado por created_at asc (porque la query lo trae así)
    const winner = list[0];
    const losers = list.slice(1);

    clusters.push({
      det_key,
      winner,
      losers,
    });
  }

  clusters.sort((a, b) => b.losers.length - a.losers.length);

  return clusters.slice(0, limitClusters);
}
