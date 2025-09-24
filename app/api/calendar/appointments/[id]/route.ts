import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MS_MIN = 60_000;
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * MS_MIN);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    const { startAt, status, employeeId, resourceId, notes } = body ?? {};

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // reprogramación (recalcula endAt con la duración del service)
    let patch: any = {};
    if (startAt) {
      const s = new Date(startAt);
      const e = addMin(s, appt.service.durationMin);
      patch.startAt = s;
      patch.endAt = e;
    }
    if (status) patch.status = status;
    if (notes !== undefined) patch.notes = notes ?? null;
    if (employeeId !== undefined) patch.employeeId = employeeId ?? null;
    if (resourceId !== undefined) patch.resourceId = resourceId ?? null;

    const updated = await prisma.appointment.update({
      where: { id },
      data: patch,
    });

    return NextResponse.json({ appointment: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ appointment: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
