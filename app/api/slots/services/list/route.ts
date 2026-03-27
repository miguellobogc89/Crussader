// app/api/slots/services/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId")?.trim() ?? "";
    const companyIdFromQuery = searchParams.get("companyId")?.trim() ?? "";

    let companyId = companyIdFromQuery;

    if (!companyId && locationId) {
      const location = await prisma.location.findUnique({
        where: {
          id: locationId,
        },
        select: {
          companyId: true,
        },
      });

      if (!location) {
        return NextResponse.json(
          { ok: false, error: "Location not found." },
          { status: 404 }
        );
      }

      companyId = location.companyId;
    }

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId or locationId is required." },
        { status: 400 }
      );
    }

    const services = await prisma.slot_recovery_service.findMany({
      where: {
        company_id: companyId,
        active: true,
      },
      orderBy: [{ position: "asc" }, { created_at: "asc" }],
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