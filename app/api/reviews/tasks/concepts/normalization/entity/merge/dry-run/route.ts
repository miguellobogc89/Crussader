// app/api/reviews/tasks/concepts/normalization/entity/merge/dry-run/route.ts
import { NextResponse } from "next/server";
import { dryRunMergeEntities } from "@/app/server/concepts/normalization/entity/dryRunMergeEntities";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

    const clusters = await dryRunMergeEntities(limit);

    return NextResponse.json({
      ok: true,
      clusters: clusters.length,
      preview: clusters,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
