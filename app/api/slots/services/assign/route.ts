// app/api/slots/services/assign/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AssignSlotServicesBody = {
  slotId?: string;
  services?: Array<{
    serviceId?: string;
    position?: number;
  }>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssignSlotServicesBody;

    const slotId =
      typeof body.slotId === "string" ? body.slotId.trim() : "";

    if (!slotId) {
      return NextResponse.json(
        { ok: false, error: "slotId is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.services)) {
      return NextResponse.json(
        { ok: false, error: "services must be an array." },
        { status: 400 }
      );
    }

    const normalizedServices = body.services
      .map((service, index) => {
        const serviceId =
          typeof service.serviceId === "string"
            ? service.serviceId.trim()
            : "";

        if (!serviceId) {
          return null;
        }

        let position = index;

        if (
          typeof service.position === "number" &&
          Number.isInteger(service.position) &&
          service.position >= 0
        ) {
          position = service.position;
        }

        return {
          slot_recovery_slot_id: slotId,
          slot_recovery_service_id: serviceId,
          position,
        };
      })
      .filter((service) => service !== null);

    await prisma.slot_recovery_slot_service.deleteMany({
      where: {
        slot_recovery_slot_id: slotId,
      },
    });

    if (normalizedServices.length > 0) {
      await prisma.slot_recovery_slot_service.createMany({
        data: normalizedServices,
      });
    }

    return NextResponse.json({
      ok: true,
      count: normalizedServices.length,
    });
  } catch (error) {
    console.error("[POST /api/slots/services/assign]", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}