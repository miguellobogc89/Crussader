// app/api/reviews/insights/highlights/enrich/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { enrichHighlight, type HighlightBlock } from "@/app/server/insights/highlights/enrichHighlight";

type InTag = { label: string; mentions: number };
type InPayload = {
  locationId: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  success: InTag[];
  improve: InTag[];
  attention: InTag[];
};

type OutTag = { label: string; mentions: number; icon: string; copy: string };

function asArray(x: any): InTag[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((r) => ({
      label: String(r?.label ?? "").trim(),
      mentions: Number(r?.mentions ?? 0) || 0,
    }))
    .filter((r) => r.label.length > 0);
}

async function getHints(args: {
  locationId: string;
  from: string;
  to: string;
  label: string;
}): Promise<{ top_entities: string[]; sample_summaries: string[] }> {
  // 1) Top entities del aspect en ese rango (máx 3)
  const ents = await prisma.$queryRaw<{ entity: string; c: number }[]>`
    SELECT
      ne.display_name AS entity,
      COUNT(*)::int AS c
    FROM concept c
    JOIN normalized_aspect na ON na.id = c.normalized_aspect_id
    JOIN normalized_entity ne ON ne.id = c.normalized_entity_id
    WHERE c.location_id = ${args.locationId}
      AND na.display_name = ${args.label}
      AND COALESCE(c.review_published_at, c.review_date, c.created_at) >= ${args.from}::date
      AND COALESCE(c.review_published_at, c.review_date, c.created_at) < ${args.to}::date
      AND c.normalized_aspect_id IS NOT NULL
      AND c.normalized_entity_id IS NOT NULL
      AND na.is_active = true
      AND ne.is_active = true
    GROUP BY ne.display_name
    ORDER BY COUNT(*) DESC, ne.display_name ASC
    LIMIT 3;
  `;

  // 2) Ejemplos de summary (máx 2) del aspect en ese rango
  const sums = await prisma.$queryRaw<{ summary: string }[]>`
    SELECT
      COALESCE((c.structured->>'summary')::text, '') AS summary
    FROM concept c
    JOIN normalized_aspect na ON na.id = c.normalized_aspect_id
    WHERE c.location_id = ${args.locationId}
      AND na.display_name = ${args.label}
      AND COALESCE(c.review_published_at, c.review_date, c.created_at) >= ${args.from}::date
      AND COALESCE(c.review_published_at, c.review_date, c.created_at) < ${args.to}::date
      AND c.normalized_aspect_id IS NOT NULL
      AND na.is_active = true
      AND COALESCE((c.structured->>'summary')::text, '') <> ''
    ORDER BY COALESCE(c.review_published_at, c.review_date, c.created_at) DESC
    LIMIT 2;
  `;

  return {
    top_entities: ents.map((x) => String(x.entity)).filter(Boolean),
    sample_summaries: sums.map((x) => String(x.summary)).filter(Boolean),
  };
}

async function enrichList(args: {
  block: HighlightBlock;
  items: InTag[];
  locationId: string;
  from: string;
  to: string;
  business?: { name?: string | null; type?: string | null; activity?: string | null };
}): Promise<OutTag[]> {
  const out: OutTag[] = [];

  for (const item of args.items.slice(0, 5)) {
    const hints = await getHints({
      locationId: args.locationId,
      from: args.from,
      to: args.to,
      label: item.label,
    });

    const enriched = await enrichHighlight({
      label: item.label,
      block: args.block,
      mentions: item.mentions,
      businessName: args.business?.name ?? null,
      businessType: args.business?.type ?? null,
      activityName: args.business?.activity ?? null,
      hints,
    });

    out.push({
      label: item.label,
      mentions: item.mentions,
      icon: enriched.icon,
      copy: enriched.copy,
    });
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as InPayload | null;
    if (!body) return NextResponse.json({ ok: false, error: "body requerido" }, { status: 400 });

    const locationId = String(body.locationId ?? "").trim();
    const from = String(body.from ?? "").trim();
    const to = String(body.to ?? "").trim();

    if (!locationId) return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });
    if (!from || !to) return NextResponse.json({ ok: false, error: "from/to requeridos" }, { status: 400 });

    const success = asArray(body.success);
    const improve = asArray(body.improve);
    const attention = asArray(body.attention);

    // contexto ligero (opcional) para que el copy suene más “de negocio”
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        title: true,
        type: { select: { name: true, activity: { select: { name: true } } } },
      },
    });

    const business = {
      name: loc?.title ?? null,
      type: loc?.type?.name ?? null,
      activity: loc?.type?.activity?.name ?? null,
    };

    const [successEnriched, improveEnriched, attentionEnriched] = await Promise.all([
      enrichList({ block: "success", items: success, locationId, from, to, business }),
      enrichList({ block: "improve", items: improve, locationId, from, to, business }),
      enrichList({ block: "attention", items: attention, locationId, from, to, business }),
    ]);

    return NextResponse.json({
      ok: true,
      success: successEnriched,
      improve: improveEnriched,
      attention: attentionEnriched,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
