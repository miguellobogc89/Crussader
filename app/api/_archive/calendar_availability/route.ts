import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");

  if (!locationId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const dayStart = new Date(dateStr + "T00:00:00.000Z");
  const dayEnd = new Date(dateStr + "T23:59:59.999Z");

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        requiredRoleId: true,
        requiredResourceTagId: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        locationId,
        startAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["BOOKED", "PENDING"] },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        employeeId: true,
        resourceId: true,
      },
    });

    const employeeBlocks = await prisma.employeeTimeOff.findMany({
      where: {
        locationId,
        OR: [
          { startAt: { gte: dayStart, lte: dayEnd } },
          { endAt: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: { id: true, startAt: true, endAt: true, employeeId: true },
    });

    const resourceBlocks = await prisma.resourceTimeOff.findMany({
      where: {
        locationId,
        OR: [
          { startAt: { gte: dayStart, lte: dayEnd } },
          { endAt: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: { id: true, startAt: true, endAt: true, resourceId: true },
    });

    return NextResponse.json({
      service,
      appointments,
      employeeBlocks,
      resourceBlocks,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
