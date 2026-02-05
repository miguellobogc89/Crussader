// app/api/reviews/tasks/concepts/normalization/entity/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/server/db";
import { normalizeEntity } from "@/app/server/concepts/normalization/entity/normalizeEntity";
import { persistEntityNormalization } from "@/app/server/concepts/normalization/entity/persistEntityNormalization";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const locationId = searchParams.get("locationId");
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 20)));

  // 1) Conceptos pendientes: structured NO null + sin link entity todavía
  const where: any = {
    structured: { not: Prisma.JsonNull },
    normalized_entity_id: null,
  };

  if (locationId) {
    where.location_id = locationId;
  }

  const pending = await prisma.concept.findMany({
    where,
    select: {
      id: true,
      structured: true,
    },
    orderBy: { created_at: "asc" },
    take: limit,
  });

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // 2) Candidatos existentes (match rápido)
  const candidates = await prisma.normalized_entity.findMany({
    where: { is_active: true },
    select: { id: true, display_name: true, canonical_key: true },
    orderBy: { usage_count: "desc" },
    take: 60,
  });

  let processed = 0;

  for (const c of pending) {
    const s = (c.structured as any) ?? {};
    const entity = String(s.entity ?? "").trim();
    let aspect: string | null = null;

    if (s.aspect) {
      aspect = String(s.aspect).trim();
    }

    if (!entity) continue;

    const result = await normalizeEntity({
      entity,
      aspect,
      candidates,
    });

    // Si create viene vacío, no persistimos
    if (result.action === "create") {
      if (!result.canonical_key || !result.display_name) continue;
    }

    await persistEntityNormalization(c.id, entity, aspect, result);
    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
