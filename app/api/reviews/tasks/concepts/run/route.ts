// app/api/reviews/tasks/concepts/run/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

type RunResult = {
  ok: true;
  scope: "location" | "global";
  locationId: string | null;

  extracted_reviews: number;
  inserted_concepts: number;

  normalized_entities: number;
  normalized_aspects: number;
};

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.floor(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

async function callJSON(url: URL) {
  const res = await fetch(url.toString(), { method: "GET" });
  const json = await res.json().catch(() => null);
  return { res, json };
}

async function runForLocation(origin: string, locationId: string, opts: {
  conceptLimit: number;
  normalizeEntityLimit: number;
  normalizeAspectLimit: number;
  maxConceptBatches: number;
  maxEntityBatches: number;
  maxAspectBatches: number;
}) {
  let extracted_reviews = 0;
  let inserted_concepts = 0;
  let normalized_entities = 0;
  let normalized_aspects = 0;

  // 1) Extract concepts (batch loop)
  for (let i = 0; i < opts.maxConceptBatches; i++) {
    const u = new URL("/api/reviews/tasks/concepts/process", origin);
    u.searchParams.set("locationId", locationId);
    u.searchParams.set("limit", String(opts.conceptLimit));

    const { res, json } = await callJSON(u);

    if (!res.ok || !json || json.ok === false) {
      const msg =
        (json && typeof json.error === "string" && json.error) || `HTTP ${res.status}`;
      throw new Error(`concepts/process failed: ${msg}`);
    }

    const processed = Number(json.processed ?? 0);
    const inserted = Number(json.insertedConcepts ?? 0);

    extracted_reviews += processed;
    inserted_concepts += inserted;

    if (processed === 0) break;
  }

  // 2) Normalize entities (batch loop) — filtered by locationId
  for (let i = 0; i < opts.maxEntityBatches; i++) {
    const u = new URL("/api/reviews/tasks/concepts/normalization/entity", origin);
    u.searchParams.set("locationId", locationId);
    u.searchParams.set("limit", String(opts.normalizeEntityLimit));

    const { res, json } = await callJSON(u);

    if (!res.ok || !json || json.ok === false) {
      const msg =
        (json && typeof json.error === "string" && json.error) || `HTTP ${res.status}`;
      throw new Error(`normalization/entity failed: ${msg}`);
    }

    const processed = Number(json.processed ?? 0);
    normalized_entities += processed;

    if (processed === 0) break;
  }

  // 3) Normalize aspects (batch loop) — filtered by locationId
  for (let i = 0; i < opts.maxAspectBatches; i++) {
    const u = new URL("/api/reviews/tasks/concepts/normalization/aspect", origin);
    u.searchParams.set("locationId", locationId);
    u.searchParams.set("limit", String(opts.normalizeAspectLimit));

    const { res, json } = await callJSON(u);

    if (!res.ok || !json || json.ok === false) {
      const msg =
        (json && typeof json.error === "string" && json.error) || `HTTP ${res.status}`;
      throw new Error(`normalization/aspect failed: ${msg}`);
    }

    const processed = Number(json.processed ?? 0);
    normalized_aspects += processed;

    if (processed === 0) break;
  }

  return {
    extracted_reviews,
    inserted_concepts,
    normalized_entities,
    normalized_aspects,
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;

    const locationId = url.searchParams.get("locationId");

    // límites razonables (puedes tunear luego)
    const conceptLimit = clampInt(url.searchParams.get("conceptLimit"), 200, 10, 200);
    const normalizeEntityLimit = clampInt(url.searchParams.get("entityLimit"), 50, 10, 200);
    const normalizeAspectLimit = clampInt(url.searchParams.get("aspectLimit"), 200, 10, 500);

    const maxConceptBatches = clampInt(url.searchParams.get("maxConceptBatches"), 10, 1, 50);
    const maxEntityBatches = clampInt(url.searchParams.get("maxEntityBatches"), 10, 1, 50);
    const maxAspectBatches = clampInt(url.searchParams.get("maxAspectBatches"), 10, 1, 50);

    const opts = {
      conceptLimit,
      normalizeEntityLimit,
      normalizeAspectLimit,
      maxConceptBatches,
      maxEntityBatches,
      maxAspectBatches,
    };

    // ===== Local run =====
    if (locationId) {
      const r = await runForLocation(origin, locationId, opts);

      const out: RunResult = {
        ok: true,
        scope: "location",
        locationId,
        extracted_reviews: r.extracted_reviews,
        inserted_concepts: r.inserted_concepts,
        normalized_entities: r.normalized_entities,
        normalized_aspects: r.normalized_aspects,
      };

      return NextResponse.json(out);
    }

    // ===== Global run =====
    // Extraer requiere locationId → iteramos locations activas
    const locations = await prisma.location.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: 200, // safety cap
    });

    let extracted_reviews = 0;
    let inserted_concepts = 0;
    let normalized_entities = 0;
    let normalized_aspects = 0;

    for (const loc of locations) {
      const r = await runForLocation(origin, loc.id, opts);
      extracted_reviews += r.extracted_reviews;
      inserted_concepts += r.inserted_concepts;
      normalized_entities += r.normalized_entities;
      normalized_aspects += r.normalized_aspects;
    }

    const out: RunResult = {
      ok: true,
      scope: "global",
      locationId: null,
      extracted_reviews,
      inserted_concepts,
      normalized_entities,
      normalized_aspects,
    };

    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
