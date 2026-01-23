// app/api/reviews/normalized/rank/aspects/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/server/db";

type RankRow = {
  id: string;
  display_name: string;
  canonical_key: string;
  mentions: number;
  avg_signed: number;
  avg_intensity: number;
  pos: number;
  neg: number;
  neu: number;
};

function signOf(j: string): number {
  const x = String(j || "").toLowerCase();
  if (x === "positive") return 1;
  if (x === "negative") return -1;
  return 0;
}

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
    const { searchParams } = new URL(req.url);

    const locationId = String(searchParams.get("locationId") ?? "").trim();
    if (!locationId) {
      return NextResponse.json({ ok: false, error: "missing_locationId" }, { status: 400 });
    }

    const limit = clampInt(searchParams.get("limit"), 20, 5, 200);
    const minMentions = clampInt(searchParams.get("minMentions"), 3, 1, 50);

    // Si luego quieres rango de fechas, lo añadimos, pero ahora lo dejo fuera por foco.
    const links = await prisma.concept_normalized_aspect.findMany({
      where: { status: "active" },
      select: {
        normalized_aspect_id: true,
        concept: {
          select: {
            location_id: true,
            structured: true,
          },
        },
      },
      take: 20000, // guardrail simple; si hace falta paginar, lo hacemos luego
      orderBy: { created_at: "desc" },
    });

    // Filtramos por location en memoria (más simple, sin depender de joins avanzados)
    const bucket = new Map<
      string,
      {
        mentions: number;
        sumSigned: number;
        sumIntensity: number;
        pos: number;
        neg: number;
        neu: number;
      }
    >();

    for (const l of links) {
      if (l.concept?.location_id !== locationId) continue;

      const st = l.concept.structured as any | null;
      if (!st || typeof st !== "object") continue;

      const judgment = String(st.judgment ?? st.sentiment ?? "").trim();
      const intensityRaw = st.intensity ?? st.confidence;
      const intensity = Number(intensityRaw);

      if (!Number.isFinite(intensity)) continue;

      const s = signOf(judgment);
      const signed = s * Math.max(0, Math.min(1, intensity));

      const cur = bucket.get(l.normalized_aspect_id) ?? {
        mentions: 0,
        sumSigned: 0,
        sumIntensity: 0,
        pos: 0,
        neg: 0,
        neu: 0,
      };

      cur.mentions += 1;
      cur.sumSigned += signed;
      cur.sumIntensity += Math.max(0, Math.min(1, intensity));

      if (s === 1) cur.pos += 1;
      if (s === -1) cur.neg += 1;
      if (s === 0) cur.neu += 1;

      bucket.set(l.normalized_aspect_id, cur);
    }

    const ids = [...bucket.keys()];
    if (ids.length === 0) {
      return NextResponse.json({ ok: true, locationId, best: [], worst: [] });
    }

    const aspects = await prisma.normalized_aspect.findMany({
      where: { id: { in: ids } },
      select: { id: true, display_name: true, canonical_key: true },
    });

    const rows: RankRow[] = aspects
      .map((a) => {
        const b = bucket.get(a.id);
        if (!b) return null;

        if (b.mentions < minMentions) return null;

        return {
          id: a.id,
          display_name: a.display_name,
          canonical_key: a.canonical_key,
          mentions: b.mentions,
          avg_signed: b.sumSigned / b.mentions,
          avg_intensity: b.sumIntensity / b.mentions,
          pos: b.pos,
          neg: b.neg,
          neu: b.neu,
        };
      })
      .filter((x): x is RankRow => Boolean(x));

    const best = [...rows].sort((a, b) => b.avg_signed - a.avg_signed).slice(0, limit);
    const worst = [...rows].sort((a, b) => a.avg_signed - b.avg_signed).slice(0, limit);

    return NextResponse.json({
      ok: true,
      locationId,
      formula: "avg_signed = avg(sign(judgment) * intensity)",
      minMentions,
      best,
      worst,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
