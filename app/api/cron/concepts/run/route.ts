import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const revalidate = 0;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_CONCEPTS_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const origin =
    process.env.CRON_BASE_URL ??
    new URL(req.url).origin;

  const locations = await prisma.location.findMany({
    select: { id: true },
  });

  let processedReviews = 0;
  let insertedConcepts = 0;

  for (const loc of locations) {
    while (true) {
      const url = new URL("/api/reviews/tasks/concepts/process", origin);
      url.searchParams.set("locationId", loc.id);
      url.searchParams.set("limit", "200"); // batch seguro

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.CRON_CONCEPTS_SECRET}`,
        },
      });

      if (!res.ok) {
        const t = await res.text();
        return NextResponse.json(
          { ok: false, locationId: loc.id, error: t },
          { status: 500 },
        );
      }

      const json = await res.json();
      const processed = Number(json?.processed ?? 0);

      processedReviews += processed;
      insertedConcepts += Number(json?.insertedConcepts ?? 0);

      if (processed === 0) break; // 🔥 backlog vacío
    }
  }

  return NextResponse.json({
    ok: true,
    locations: locations.length,
    processedReviews,
    insertedConcepts,
  });
}
