// app/api/calendar/shift-events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    const locationId = searchParams.get("locationId");
    const employeeId = searchParams.get("employeeId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!companyId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "companyId, from y to son obligatorios" },
        { status: 400 }
      );
    }

    const events = await prisma.shiftEvent.findMany({
      where: {
        companyId,
        ...(locationId ? { locationId } : {}),
        ...(employeeId ? { employeeId } : {}),
        startAt: { lt: new Date(`${to}T23:59:59.999Z`) },
        endAt: { gt: new Date(`${from}T00:00:00.000Z`) },
      },
      select: {
        id: true,
        employeeId: true,
        locationId: true,
        startAt: true,
        endAt: true,
        kind: true,
        label: true,
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
