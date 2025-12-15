import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const revalidate = 0;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_CONCEPTS_SECRET;

  // 1) Tu forma “manual” (script/botón)
  const auth = req.headers.get("authorization") ?? "";
  if (secret && auth === `Bearer ${secret}`) return true;

  // 2) Permitir invocación de Vercel Cron (GET) por User-Agent
  // Vercel cron invocations llevan user-agent "vercel-cron" :contentReference[oaicite:1]{index=1}
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

  let processedReviews = 0;
  let insertedConcepts = 0;

  for (const loc of locations) {
    while (true) {
      const url = new URL("/api/reviews/tasks/concepts/process", origin);
      url.searchParams.set("locationId", loc.id);
      url.searchParams.set("limit", "200");

      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return NextResponse.json(
          { ok: false, locationId: loc.id, status: res.status, body: t.slice(0, 2000) },
          { status: 500 },
        );
      }

      const json = await res.json();
      const processed = Number(json?.processed ?? 0);
      processedReviews += processed;
      insertedConcepts += Number(json?.insertedConcepts ?? 0);

      if (processed === 0) break;
    }
  }

  return NextResponse.json({
    ok: true,
    locations: locations.length,
    processedReviews,
    insertedConcepts,
  });
}

export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}
