// app/api/reviews/tasks/concepts/normalization/entity/merge/dry-run/route.ts
import { NextResponse } from "next/server";
import { dryRunMergeEntities } from "@/app/server/concepts/normalization/entity/dryRunMergeEntities";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

  const clusters = await dryRunMergeEntities(limit);

  return NextResponse.json({
    ok: true,
    clusters: clusters.map((c) => ({
      winner: c.winner,
      losers: c.losers,
      loser_count: c.losers.length,
    })),
  });
}
