import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

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
    const limit = clampInt(url.searchParams.get("limit"), 200, 1, 1000);

    // 1) coger batch pendiente: solo marcar si ya tiene ambos ids cacheados
    const pending = await prisma.concept.findMany({
      where: {
        normalized_at: null,
        normalized_aspect_id: { not: null },
        normalized_entity_id: { not: null },
      },
      select: { id: true },
      orderBy: { created_at: "asc" },
      take: limit,
    });

    if (pending.length === 0) {
      return NextResponse.json({ ok: true, marked: 0 });
    }

    const ids = pending.map((x) => x.id);
    const now = new Date();

    // 2) marcar (idempotente)
    const upd = await prisma.concept.updateMany({
      where: { id: { in: ids }, normalized_at: null },
      data: { normalized_at: now },
    });

    return NextResponse.json({
      ok: true,
      requested: limit,
      selected: ids.length,
      marked: upd.count,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
