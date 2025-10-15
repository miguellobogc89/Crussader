// app/api/reviews/tasks/conceptualize/route.ts
// ==============================================
// 📌 Descripción:
// Endpoint manual para lanzar el batch de conceptualización.
// Body opcional: { limit?: number }
// Respuesta: { ok: true, processed, newConcepts, linked }
// ==============================================

import { NextResponse } from "next/server";
// ⚠️ Ajusta el import relativo si no usas alias "@/..."
import { processUnconceptualizedBatch } from "@/app/server/concepts/processBatch";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = typeof body?.limit === "number" && body.limit > 0 ? Math.min(body.limit, 500) : 100;

    const result = await processUnconceptualizedBatch(limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}

// (opcional) pequeño smoke test por GET
export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST here with { limit } to run conceptualization." });
}
