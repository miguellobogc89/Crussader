// app/api/brain/context/route.ts
import { NextResponse } from "next/server";
import { buildBrainContextV1 } from "@/lib/brain/context/buildBrainContextV1";
import { brainTick } from "@/lib/brain/brainTick";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { ok: false, error: "Missing companyId query param" },
      { status: 400 }
    );
  }

  const { ctx, debug } = await buildBrainContextV1(companyId);
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
  }

  const insights = brainTick(ctx);

  console.log("[brain-context]", debug);
  console.log("[brain-debug-v1]", { companyId, insightsCount: insights.length });

  return NextResponse.json({ ok: true, context: ctx, insights });
}