// app/api/reviews/tasks/concepts/normalization/aspect/merge/dry-run/route.ts
import { NextResponse } from "next/server";
import { dryRunMergeAspects } from "@/app/server/concepts/normalization/aspects/dryRunMergeAspects";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

  const clusters = await dryRunMergeAspects(limit);

  return NextResponse.json({
    ok: true,
    clusters: clusters.map((c) => ({
      det_key: c.det_key,
      winner: c.winner,
      losers: c.losers,
      loser_count: c.losers.length,
    })),
  });
}
