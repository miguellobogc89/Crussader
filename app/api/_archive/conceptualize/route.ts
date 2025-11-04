// app/api/reviews/tasks/conceptualize/route.ts
import { NextResponse } from "next/server";
import { processUnconceptualizedBatch } from "@/app/server/concepts/processBatch";

// POST /api/reviews/tasks/conceptualize
// body: { locationId: string, limit?: number }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const locationId =
      typeof body?.locationId === "string" && body.locationId.trim().length > 0
        ? body.locationId.trim()
        : null;

    const limitRaw =
      typeof body?.limit === "number" && Number.isFinite(body.limit) ? body.limit : 100;
    const limit = Math.max(1, Math.min(limitRaw, 500));

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    const result = await processUnconceptualizedBatch(locationId, limit);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

// (Opcional) GET /api/reviews/tasks/conceptualize?locationId=...&limit=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const limit = Math.max(
    1,
    Math.min(Number(searchParams.get("limit") ?? "100"), 500)
  );

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId is required" },
      { status: 400 }
    );
  }

  const result = await processUnconceptualizedBatch(locationId, limit);
  return NextResponse.json({ ok: true, ...result });
}

export const dynamic = "force-dynamic";
