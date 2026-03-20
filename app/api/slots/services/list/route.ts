// app/api/slots/services/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId")?.trim() ?? "";

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required." },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: {
        id: locationId,
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "Location not found." },
        { status: 404 }
      );
    }

    const services = await prisma.slot_recovery_service.findMany({
      where: {
        company_id: location.companyId,
        active: true,
      },
      orderBy: [
        { position: "asc" },
        { created_at: "asc" },
      ],
    });

    return NextResponse.json({
      ok: true,
      services: services.map((service) => {
        return {
          id: service.id,
          name: service.name,
          price: Number(service.price),
          durationMin: service.duration_min,
          active: service.active,
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/services/list]", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}