// app/api/calendar/shift-events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const employeeId = searchParams.get("employeeId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!locationId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "locationId, from y to son obligatorios" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(+fromDate) || Number.isNaN(+toDate)) {
      return NextResponse.json(
        { ok: false, error: "from/to inválidos" },
        { status: 400 }
      );
    }

    // Resolver companyId desde la Location
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { companyId: true },
    });

    if (!loc?.companyId) {
      return NextResponse.json(
        { ok: false, error: "Location sin companyId" },
        { status: 400 }
      );
    }

    const companyId = loc.companyId;

    const events = await prisma.shiftEvent.findMany({
      where: {
        companyId,
        locationId,
        ...(employeeId ? { employeeId } : {}),
        startAt: { lt: toDate },
        endAt: { gt: fromDate },
      },
      select: {
        id: true,
        employeeId: true,
        locationId: true,
        startAt: true,
        endAt: true,
        kind: true,
        label: true,
        templateId: true,
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ ok: true, items: events });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
