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
        { status: 400 },
      );
    }

    if (!Array.isArray(body.services)) {
      return NextResponse.json(
        { ok: false, error: "services must be an array." },
        { status: 400 },
      );
    }

    const slot = await prisma.slot_recovery_slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        company_id: true,
        recovered_at: true,
        status: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { ok: false, error: "slot_not_found" },
        { status: 404 },
      );
    }

    if (slot.recovered_at || slot.status === "recovered") {
      return NextResponse.json(
        { ok: false, error: "slot_already_recovered" },
        { status: 409 },
      );
    }

    const serviceIds = body.services
      .map((service) => {
        return typeof service.serviceId === "string"
          ? service.serviceId.trim()
          : "";
      })
      .filter((serviceId, index, array) => {
        return serviceId.length > 0 && array.indexOf(serviceId) === index;
      });

    const validServices = await prisma.slot_recovery_service.findMany({
      where: {
        id: { in: serviceIds },
        company_id: slot.company_id,
        active: true,
      },
      select: {
        id: true,
      },
    });

    const validServiceIds = new Set(validServices.map((service) => service.id));

    const normalizedServices = serviceIds
      .filter((serviceId) => validServiceIds.has(serviceId))
      .map((serviceId, index) => {
        return {
          slot_recovery_slot_id: slotId,
          slot_recovery_service_id: serviceId,
          position: index,
        };
      });

    if (normalizedServices.length !== serviceIds.length) {
      return NextResponse.json(
        { ok: false, error: "invalid_services_for_slot" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.slot_recovery_slot_service.deleteMany({
        where: {
          slot_recovery_slot_id: slotId,
        },
      });

      if (normalizedServices.length > 0) {
        await tx.slot_recovery_slot_service.createMany({
          data: normalizedServices,
        });
      }

      await tx.slot_recovery_slot.update({
        where: { id: slotId },
        data: {
          updated_at: new Date(),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      count: normalizedServices.length,
    });
  } catch (error) {
    console.error("[POST /api/slots/services/assign]", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}