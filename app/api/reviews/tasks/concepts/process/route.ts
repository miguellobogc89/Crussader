import { NextResponse } from "next/server";
import { processUnconceptualizedBatch  } from "@/app/server/concepts/processBatch";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));

    if (!locationId) return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });

    const result = await processUnconceptualizedBatch (locationId, limit);
    return NextResponse.json({ ok: true, locationId, limit, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}

export const revalidate = 0;
