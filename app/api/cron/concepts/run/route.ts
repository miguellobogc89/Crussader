// app/api/cron/concepts/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const revalidate = 0;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_CONCEPTS_SECRET;

  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;

  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("vercel-cron")) return true;

  return false;
}

async function run(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const origin = process.env.CRON_BASE_URL ?? new URL(req.url).origin;

  const locations = await prisma.location.findMany({ select: { id: true } });

  let extracted_reviews = 0;
  let inserted_concepts = 0;
  let normalized_entities = 0;
  let normalized_aspects = 0;

  for (const loc of locations) {
    const url = new URL("/api/reviews/tasks/concepts/run", origin);
    url.searchParams.set("locationId", loc.id);

    url.searchParams.set("conceptLimit", "200");
    url.searchParams.set("entityLimit", "50");
    url.searchParams.set("aspectLimit", "200");

    url.searchParams.set("maxConceptBatches", "2");
    url.searchParams.set("maxEntityBatches", "2");
    url.searchParams.set("maxAspectBatches", "2");

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, locationId: loc.id, status: res.status, body: t.slice(0, 2000) },
        { status: 500 },
      );
    }

    const json = await res.json().catch(() => null);

    extracted_reviews += Number(json?.extracted_reviews ?? 0);
    inserted_concepts += Number(json?.inserted_concepts ?? 0);
    normalized_entities += Number(json?.normalized_entities ?? 0);
    normalized_aspects += Number(json?.normalized_aspects ?? 0);
  }

  return NextResponse.json({
    ok: true,
    locations: locations.length,
    extracted_reviews,
    inserted_concepts,
    normalized_entities,
    normalized_aspects,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}