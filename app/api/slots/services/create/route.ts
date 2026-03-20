// app/api/slots/services/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateServiceBody = {
  locationId?: string;
  name?: string;
  price?: number;
  durationMin?: number;
};

function normalizePriceCents(price: number): number {
  return Math.round(price * 100);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateServiceBody;

    const locationId =
      typeof body.locationId === "string" ? body.locationId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = typeof body.price === "number" ? body.price : NaN;
    const durationMin =
      typeof body.durationMin === "number" ? Math.floor(body.durationMin) : NaN;

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "name is required." },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "price is invalid." },
        { status: 400 }
      );
    }

    if (Number.isNaN(durationMin) || durationMin <= 0) {
      return NextResponse.json(
        { ok: false, error: "durationMin is invalid." },
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

    const lastService = await prisma.slot_recovery_service.findFirst({
      where: {
        company_id: location.companyId,
      },
      orderBy: {
        position: "desc",
      },
      select: {
        position: true,
      },
    });

    let nextPosition = 0;

    if (lastService) {
      nextPosition = lastService.position + 1;
    }

    const service = await prisma.slot_recovery_service.create({
      data: {
        company_id: location.companyId,
        name,
        duration_min: durationMin,
        price,
        price_cents: normalizePriceCents(price),
        active: true,
        position: nextPosition,
      },
    });

    return NextResponse.json({
      ok: true,
      service: {
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationMin: service.duration_min,
        active: service.active,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/services/create]", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Ya existe un servicio con ese nombre." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}