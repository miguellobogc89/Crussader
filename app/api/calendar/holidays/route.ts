// app/api/calendar/holidays/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!locationId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros obligatorios (locationId, from, to)" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { city: true, countryCode: true, region: true },
    });

    const city = (loc?.city || "").trim();
    const countryCode = (loc?.countryCode || "").trim();
    const region = (loc?.region || "").trim();

    if (!countryCode) {
      return NextResponse.json(
        { ok: true, items: [], meta: { locationId, city, region, countryCode } },
        { status: 200 }
      );
    }

    // IMPORTANT: evitamos "scope" (enum holiday_scope) para no romper Prisma.
    // Incluimos:
    // - Overrides por location_id
    // - Festivos del país (country_code)
    // - Más “afinados” por city/municipality y region_code/admin1_code si coinciden
    const where: any = {
      date: { gte: fromDate, lte: toDate },
      OR: [
        // overrides por location
        { location_id: locationId },

        // nacionales (y cualquier otro de ES dentro de rango)
        { country_code: countryCode },

        // municipales por ciudad (si hay city)
        ...(city
          ? [
              { municipality: { equals: city, mode: "insensitive" } },
              { city: { equals: city, mode: "insensitive" } },
            ]
          : []),

        // regionales si Location.region coincide (OJO: si es "Andalucía" no coincide con "AN"/"ES-AN")
        ...(region
          ? [
              { region_code: { equals: region, mode: "insensitive" } },
              { admin1_code: { equals: region, mode: "insensitive" } },
            ]
          : []),
      ],
    };

    const rows = await prisma.bankHoliday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    // Dedup (día + nombre)
    const seen = new Set<string>();
    const items: any[] = [];

    for (const r of rows) {
      const day = r.date.toISOString().slice(0, 10);
      const key = `${day}|${r.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(r);
    }

    return NextResponse.json({
      ok: true,
      meta: { locationId, city, region, countryCode, rawCount: rows.length, dedupCount: items.length },
      items,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
