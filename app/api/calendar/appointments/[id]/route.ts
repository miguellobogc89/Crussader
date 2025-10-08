// app/api/calendar/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  LocationStatus,
} from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

const MS_MIN = 60_000;

// Estados que BLOQUEAN hueco (ajustados a tu DB real)
const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.BOOKED,
  AppointmentStatus.COMPLETED,
];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;
    const body = await req.json();
    // --- Nuevo bloque para permitir actualizar cliente ---
const { customerId } = body ?? {};
const dataUpdate: any = {}; // si ya tienes uno más abajo, no declares otro, solo añade esto

if (customerId !== undefined) {
  if (customerId === null) {
    dataUpdate.customerId = null; // desvincular cliente si así lo deseas
  } else {
    const cust = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!cust) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    // obtener companyId desde la location del appointment
    const appt = await prisma.appointment.findUnique({
      where: { id },
      select: { location: { select: { companyId: true } } },
    });

    const companyId = appt?.location?.companyId;
    if (companyId) {
      await prisma.companyCustomer.upsert({
        where: { companyId_customerId: { companyId, customerId } },
        update: {},
        create: { companyId, customerId },
      });
    }

    dataUpdate.customerId = customerId;
  }
}
// --- Fin del bloque nuevo ---

    const { startAt, status, employeeId, resourceId, notes } = body ?? {};

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        service: { select: { durationMin: true, bufferBeforeMin: true, bufferAfterMin: true } },
        location: { select: { id: true, companyId: true, status: true } },
      },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (appt.location.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ error: "Location no disponible" }, { status: 409 });
    }

    // Permisos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    const [hasLoc, hasCompany] = await Promise.all([
      prisma.userLocation.findFirst({ where: { userId: user!.id, locationId: appt.locationId } }),
      prisma.userCompany.findFirst({ where: { userId: user!.id, companyId: appt.location.companyId } }),
    ]);
    if (!hasLoc && !hasCompany) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const patch: Prisma.AppointmentUpdateInput = {};
    let start = appt.startAt;
    let end = appt.endAt;

    // Reprogramación
    if (startAt) {
      const s = new Date(startAt);
      if (isNaN(s.getTime())) return NextResponse.json({ error: "startAt inválido" }, { status: 400 });
      const totalMin =
        (appt.service.durationMin ?? 0) +
        (appt.service.bufferBeforeMin ?? 0) +
        (appt.service.bufferAfterMin ?? 0);
      const e = new Date(s.getTime() + totalMin * MS_MIN);
      patch.startAt = s;
      patch.endAt = e;
      start = s;
      end = e;
    }

    // Estado: SOLO los que existen en tu DB
    const allowed: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.BOOKED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ];
    if (status && allowed.includes(status)) {
      patch.status = status as AppointmentStatus;
    }

    if (notes !== undefined) patch.notes = notes ?? null;

    // Relaciones (update correcto)
    if (employeeId !== undefined) {
      patch.employee = employeeId ? { connect: { id: employeeId } } : { disconnect: true };
    }
    if (resourceId !== undefined) {
      patch.resource = resourceId ? { connect: { id: resourceId } } : { disconnect: true };
    }

    // Solapes (solo con estados activos que tu DB soporta)
    const changedTime = !!patch.startAt;
    const changedEmp = employeeId !== undefined;
    const changedRes = resourceId !== undefined;

    if (changedTime || changedEmp || changedRes) {
      const effectiveEmployeeId = employeeId !== undefined ? employeeId : appt.employeeId;
      const effectiveResourceId = resourceId !== undefined ? resourceId : appt.resourceId;

      const overlapBase: Prisma.AppointmentWhereInput = {
        id: { not: appt.id },
        locationId: appt.locationId,
        startAt: { lt: end },
        endAt: { gt: start },
        status: { in: ACTIVE_STATUSES },
      };

      if (effectiveEmployeeId) {
        const clashEmp = await prisma.appointment.findFirst({
          where: { employeeId: effectiveEmployeeId, ...overlapBase },
          select: { id: true },
        });
        if (clashEmp) return NextResponse.json({ error: "El profesional ya tiene una cita en ese horario" }, { status: 409 });
      }
      if (effectiveResourceId) {
        const clashRes = await prisma.appointment.findFirst({
          where: { resourceId: effectiveResourceId, ...overlapBase },
          select: { id: true },
        });
        if (clashRes) return NextResponse.json({ error: "El recurso ya está ocupado en ese horario" }, { status: 409 });
      }
    }

    const updated = await prisma.appointment.update({ where: { id }, data: patch });
    return NextResponse.json({ appointment: updated });
  } catch (e: any) {
    console.error("[appointments.[id].PATCH] error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = params.id;

    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { location: { select: { companyId: true, status: true } } },
    });
    if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (appt.location.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ error: "Location no disponible" }, { status: 409 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    const [hasLoc, hasCompany] = await Promise.all([
      prisma.userLocation.findFirst({ where: { userId: user!.id, locationId: appt.locationId } }),
      prisma.userCompany.findFirst({ where: { userId: user!.id, companyId: appt.location.companyId } }),
    ]);
    if (!hasLoc && !hasCompany) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });
    return NextResponse.json({ appointment: updated });
  } catch (e: any) {
    console.error("[appointments.[id].DELETE] error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
