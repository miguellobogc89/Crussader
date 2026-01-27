// app/api/locations/[id]/enrich-from-places/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { enrichLocationFromPlaces } from "@/app/server/locations/enrichLocationFromPlaces";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

const loc = await prisma.location.findUnique({
  where: { id },
  select: {
    id: true,
    address_id: true,
    googlePlaceId: true,
    googleLocationId: true,
  },
});

if (!loc) {
  return NextResponse.json({ ok: false, error: "Location no encontrada" }, { status: 404 });
}

// Flag: si ya hay address_id, no hacemos nada
if (loc.address_id) {
  return NextResponse.json({ ok: true, skipped: true });
}


    // placeId: primero Location.googlePlaceId, si no, lo sacamos de google_gbp_location
    let placeId = loc.googlePlaceId;

    if (!placeId) {
      const gbp = await prisma.google_gbp_location.findFirst({
        where: { location_id: id, is_active: true },
        select: { place_id: true, raw_json: true },
        orderBy: { updated_at: "desc" },
      });

      placeId = gbp?.place_id ?? null;

      if (!placeId && gbp?.raw_json && typeof gbp.raw_json === "object") {
        const meta = (gbp.raw_json as any)?.metadata;
        const p = meta?.placeId;
        if (typeof p === "string" && p.length > 0) placeId = p;
      }
    }

    if (!placeId) {
      return NextResponse.json(
        { ok: false, error: "No hay placeId para esta location" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Falta GOOGLE_PLACES_API_KEY" },
        { status: 500 }
      );
    }

    const out = await enrichLocationFromPlaces({
      locationId: id,
      placeId,
      apiKey,
    });

    return NextResponse.json({ ok: true, ...out });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return POST(req, ctx);
}
