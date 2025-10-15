// app/api/reviews/tasks/concepts/batch/route.ts
// ===================================================
// Lanza manualmente el batch desde el navegador o Postman:
//    GET  /api/reviews/tasks/concepts/batch?limit=100
// ===================================================

import { NextResponse } from "next/server";
import { processUnconceptualizedBatch } from "@/app/server/concepts/processBatch";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);

  try {
    const result = await processUnconceptualizedBatch(limit);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Batch failed" }, { status: 500 });
  }
}
