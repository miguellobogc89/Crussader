// app/api/reviews/tasks/concepts/normalization/aspect/merge/apply/route.ts
import { NextResponse } from "next/server";
import { applyMergeAspects } from "@/app/server/concepts/normalization/aspects/applyMergeAspects";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

  const applied = await applyMergeAspects(limit);

  return NextResponse.json({
    ok: true,
    merged_clusters: applied.length,
    applied,
  });
}
