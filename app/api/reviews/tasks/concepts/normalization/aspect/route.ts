// app/api/reviews/tasks/concepts/normalization/aspect/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { normalizeAspectWithAI } from "@/app/server/concepts/normalization/aspects/normalizeAspect";
import { persistAspectNormalization } from "@/app/server/concepts/normalization/aspects/persistAspectNormalization";

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const locationId = url.searchParams.get("locationId");
    const limit = clampInt(url.searchParams.get("limit"), 200, 10, 500);

    const existingAspects = await prisma.normalized_aspect.findMany({
      where: { is_active: true },
      select: {
        id: true,
        canonical_key: true,
        display_name: true,
        description: true,
        examples: true,
      },
      orderBy: { usage_count: "desc" },
    });

    const where: any = { normalized_aspect_id: null };
    if (locationId) {
      where.location_id = locationId;
    }

    const concepts = await prisma.concept.findMany({
      where,
      select: { id: true, structured: true },
      take: limit,
      orderBy: { created_at: "asc" },
    });

    let processed = 0;

    for (const c of concepts) {
      const st = c.structured as any | null;
      if (!st || typeof st !== "object") continue;

      const aspect = typeof st.aspect === "string" ? st.aspect.trim() : "";
      if (!aspect) continue;

      const entity = typeof st.entity === "string" ? st.entity.trim() : null;
      const descriptor =
        typeof st.descriptor === "string" ? st.descriptor.trim() : null;

      const result = await normalizeAspectWithAI(
        { aspect, entity, descriptor },
        existingAspects,
      );

      await persistAspectNormalization(c.id, aspect, entity, result);
      processed += 1;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
