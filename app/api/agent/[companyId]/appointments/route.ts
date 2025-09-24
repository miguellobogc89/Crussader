// app/api/agent/[companyId]/appointments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    // 1) Auth por API key (agente)
    const auth = req.headers.get("authorization");
    const apiKey = process.env.CALENDAR_API_KEY;
    if (auth !== `Bearer ${apiKey}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2) Leer payload
    const body = await req.json();
    const {
      locationId,
      serviceId,
      startAt, // ISO UTC
      customerName,
      customerPhone,
      customerEmail,
      notes,
      employeeId, // opcional
      resourceId, // opcional
      status,     // opcional
    } = body ?? {};

    if (!locationId || !serviceId || !startAt) {
      return NextResponse.json(
        { ok: false, error: "locationId, serviceId y startAt son obligatorios" },
        { status: 400 }
      );
    }

    const start = new Date(startAt);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ ok: false, error: "startAt inválido" }, { status: 400 });
    }

    // 3) Validar que la location pertenece a la company
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, companyId: true },
    });
    if (!location || location.companyId !== companyId) {
      return NextResponse.json({ ok: false, error: "Location no pertenece a la empresa" }, { status: 403 });
    }

    // 4) Obtener servicio y calcular endAt (duración + buffers)
    const service = await prisma.service.findFirst({
      where: { id: serviceId, locationId, active: true },
      select: {
        id: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
      },
    });
    if (!service) {
      return NextResponse.json({ ok: false, error: "Servicio no disponible en esta ubicación" }, { status: 404 });
    }
    const totalMin =
      (service.durationMin ?? 0) + (service.bufferBeforeMin ?? 0) + (service.bufferAfterMin ?? 0);
    const end = new Date(start.getTime() + totalMin * 60 * 1000);

    // 5) Chequeos básicos de solape si se especifica empleado o recurso (MVP)
    const overlapWhereBase: any = {
      startAt: { lt: end },
      endAt: { gt: start },
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED] },
    };
    if (employeeId) {
      const clashEmployee = await prisma.appointment.findFirst({
        where: { employeeId, ...overlapWhereBase },
        select: { id: true },
      });
      if (clashEmployee) {
        return NextResponse.json({ ok: false, error: "Profesional ocupado en ese horario" }, { status: 409 });
      }
    }
    if (resourceId) {
      const clashResource = await prisma.appointment.findFirst({
        where: { resourceId, ...overlapWhereBase },
        select: { id: true },
      });
      if (clashResource) {
        return NextResponse.json({ ok: false, error: "Recurso/Sala ocupada en ese horario" }, { status: 409 });
      }
    }

    // 6) Crear cita
    const created = await prisma.appointment.create({
      data: {
        locationId,
        serviceId,
        startAt: start,
        endAt: end,
        status: Object.values(AppointmentStatus).includes(status) ? status : AppointmentStatus.BOOKED,
        employeeId: employeeId || null,
        resourceId: resourceId || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        notes: notes || null,
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        service: { select: { id: true, name: true } },
        location: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    console.error("[agent.appointments.POST] error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
