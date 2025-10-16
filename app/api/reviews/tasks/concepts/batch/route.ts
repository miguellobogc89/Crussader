// app/api/reviews/tasks/concepts/batch/route.ts
import { NextResponse } from "next/server";
import { processUnconceptualizedBatch } from "@/app/server/concepts/processBatch";

// GET /api/reviews/tasks/concepts/batch?locationId=...&limit=50
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!locationId) {
    return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });
  }

  const result = await processUnconceptualizedBatch(locationId, limit);
  return NextResponse.json({ ok: true, result });
}

// POST /api/reviews/tasks/concepts/batch  { locationId: string, limit?: number }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locationId = typeof body.locationId === "string" ? body.locationId : null;
  const limit = Number.isFinite(body.limit) ? Number(body.limit) : 50;

  if (!locationId) {
    return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });
  }

  const result = await processUnconceptualizedBatch(locationId, limit);
  return NextResponse.json({ ok: true, result });
}

export const dynamic = "force-dynamic";
