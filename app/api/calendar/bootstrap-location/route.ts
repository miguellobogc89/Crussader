// /app/api/calendar/bootstrap-location/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const locationId = body?.locationId ? String(body.locationId) : null;

    if (!locationId) {
      return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });
    }

    // 1) Cargar Location
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        address_id: true,
      },
    });

    if (!loc) {
      return NextResponse.json({ ok: false, error: "Location no encontrada" }, { status: 404 });
    }

    // 2) Si falta address_id, devolvemos flag (la page ya llama a enrich-from-places aparte)
    const needsAddress = !loc.address_id;

    // 3) Copiar regular_hours desde google_gbp_location (si existe link)
    const gbp = await prisma.google_gbp_location.findFirst({
      where: { location_id: locationId, is_active: true },
      select: {
        id: true,
        regular_hours: true,
      },
      orderBy: { updated_at: "desc" },
    });

    const regularHours = gbp?.regular_hours ?? null;

    if (regularHours) {
      await prisma.location.update({
        where: { id: locationId },
        data: { openingHours: regularHours },
      });
    }

    return NextResponse.json({
      ok: true,
      needsAddress,
      openingHoursUpdated: Boolean(regularHours),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
