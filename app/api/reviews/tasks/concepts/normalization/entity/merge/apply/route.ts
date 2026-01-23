// app/api/reviews/tasks/concepts/normalization/entity/merge/apply/route.ts
import { NextResponse } from "next/server";
import { applyMergeEntities } from "@/app/server/concepts/normalization/entity/applyMergeEntities";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

  const applied = await applyMergeEntities(limit);

  return NextResponse.json({
    ok: true,
    merged_clusters: applied.length,
    applied,
  });
}

