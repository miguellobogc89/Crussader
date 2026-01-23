// app/server/concepts/normalization/entity/dryRunMergeEntities.ts
import { prisma } from "@/app/server/db";
import { canonicalizeKey } from "../canonicalizeKey";

export type MergeEntityCluster = {
  det_key: string;
  winner: {
    id: string;
    display_name: string;
    created_at: Date;
    usage_count: number | null;
  };
  losers: {
    id: string;
    display_name: string;
    created_at: Date;
    usage_count: number | null;
  }[];
};

type Row = {
  id: string;
  display_name: string;
  created_at: Date;
  usage_count: number | null;
};

export async function dryRunMergeEntities(
  limitClusters = 50,
): Promise<MergeEntityCluster[]> {
  const rows: Row[] = await prisma.normalized_entity.findMany({
    where: { is_active: true },
    select: {
      id: true,
      display_name: true,
      created_at: true,
      usage_count: true,
    },
    orderBy: { created_at: "asc" },
  });

  // group by det_key (canonicalized display_name)
  const groups = new Map<string, Row[]>();

  for (const r of rows) {
    const det = canonicalizeKey(r.display_name);
    const bucket = groups.get(det);
    if (bucket) bucket.push(r);
    else groups.set(det, [r]);
  }

  const clusters: MergeEntityCluster[] = [];

  for (const [det_key, list] of groups.entries()) {
    if (list.length <= 1) continue;

    // ya vienen ordenados por created_at asc
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
