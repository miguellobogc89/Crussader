// app/api/calendar/opening-hours/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
        { status: 400 }
      );
    }

    const loc = await prisma.location.findUnique({
      where: { id: String(locationId) },
      select: {
        id: true,
        timezone: true,
        openingHours: true,
      },
    });

    if (!loc) {
      return NextResponse.json(
        { ok: false, error: "Location no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        locationId: loc.id,
        timezone: loc.timezone || "Europe/Madrid",
        openingHours: loc.openingHours ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
