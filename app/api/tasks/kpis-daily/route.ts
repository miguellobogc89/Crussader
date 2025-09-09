// app/api/tasks/kpis-daily/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAndSaveLocationDailyKpis, todayUtcStart } from "@/lib/kpis";

async function run(secretProvided?: string) {
  // ⚠️ AUTORIZACIÓN SENCILLA:
  // - En producción: exige CRON_SECRET en .env y que coincida.
  // - En desarrollo: si no hay CRON_SECRET, permite usando cualquier "secret" en la query para no bloquearte.
  const required = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" || required) {
    if (!secretProvided || secretProvided !== required) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const snapshotDate = todayUtcStart();

  const locations = await prisma.location.findMany({
    select: { id: true, companyId: true },
  });

  const results: Array<{ locationId: string; ok: boolean; error?: string }> = [];

  for (const loc of locations) {
    try {
      await computeAndSaveLocationDailyKpis({
        companyId: loc.companyId,
        locationId: loc.id,
        snapshotDate,
      });
      results.push({ locationId: loc.id, ok: true });
    } catch (e: any) {
      results.push({ locationId: loc.id, ok: false, error: e?.message ?? "failed" });
    }
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    snapshotDate: snapshotDate.toISOString(),
    totalLocations: locations.length,
    results,
  });
}

// ✅ Ahora admite GET (para probar desde el navegador)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? undefined;
  return run(secret);
}

// Sigue existiendo POST (para cron jobs)
export async function POST(req: Request) {
  // primero mira Authorization: Bearer <secret>
  const auth = req.headers.get("authorization") || "";
  const headerSecret = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;

  // si no viene en header, prueba también ?secret= de la URL (por si lo llamas desde un cliente simple)
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret") ?? undefined;

  return run(headerSecret ?? querySecret);
}
