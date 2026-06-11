// app/api/calendar/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { updateGoogleEventForAppointment } from "@/lib/integrations/google-calendar/appointments";
import {
  PrismaClient,
  Prisma,
  AppointmentStatus,
  LocationStatus,
} from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var _prisma: PrismaClient | undefined;
}

if (!global._prisma) {
  global._prisma = new PrismaClient();
}

prisma = global._prisma;

const MS_MIN = 60_000;

const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.BOOKED,
  AppointmentStatus.COMPLETED,
];

async function getUserBySession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

async function assertAppointmentAccess(id: string) {
  const user = await getUserBySession();

  if (!user) {
    return { error: "Unauthorized", status: 401 as const, appointment: null };
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      location: {
        select: {
          id: true,
          companyId: true,
          status: true,
        },
      },
      service: {
        select: {
          id: true,
          durationMin: true,
          bufferBeforeMin: true,
          bufferAfterMin: true,
        },
      },
    },
  });

  if (!appointment) {
    return { error: "Not found", status: 404 as const, appointment: null };
  }

  if (appointment.location.status !== LocationStatus.ACTIVE) {
    return {
      error: "Location no disponible",
      status: 409 as const,
      appointment: null,
    };
  }

  const [hasLocationAccess, hasCompanyAccess] = await Promise.all([
    prisma.userLocation.findFirst({
      where: {
        userId: user.id,
        locationId: appointment.locationId,
      },
      select: { id: true },
    }),
    prisma.userCompany.findFirst({
      where: {
        userId: user.id,
        companyId: appointment.location.companyId,
      },
      select: { id: true },
    }),
  ]);

  if (!hasLocationAccess && !hasCompanyAccess) {
    return { error: "Forbidden", status: 403 as const, appointment: null };
  }

  return { error: null, status: 200 as const, appointment };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertAppointmentAccess(id);

    if (!access.appointment) {
      return NextResponse.json(
        { ok: false, error: access.error },
        { status: access.status }
      );
    }

    const appt = access.appointment;
    const body = await req.json();

    const {
      startAt,
      status,
      employeeId,
      resourceId,
      notes,
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      slotRecoveryServiceId,
      isUrgent,
    } = body ?? {};

    const patch: Prisma.AppointmentUpdateInput = {};

    let start = appt.startAt;
    let end = appt.endAt;
    let nextDurationMin = appt.serviceDurationMin ?? 30;

    let nextSlotRecoveryService:
      | {
          id: string;
          name: string;
          duration_min: number;
          price: Prisma.Decimal;
        }
      | null = null;

    if (slotRecoveryServiceId !== undefined || serviceId !== undefined) {
      const incomingServiceId = slotRecoveryServiceId ?? serviceId ?? null;

      if (incomingServiceId) {
        nextSlotRecoveryService = await prisma.slot_recovery_service.findFirst({
          where: {
            id: incomingServiceId,
            company_id: appt.location.companyId,
            active: true,
          },
          select: {
            id: true,
            name: true,
            duration_min: true,
            price: true,
          },
        });

        if (!nextSlotRecoveryService) {
          return NextResponse.json(
            { ok: false, error: "Servicio no disponible" },
            { status: 404 }
          );
        }

        patch.service = { disconnect: true };
        patch.slotRecoveryServiceId = nextSlotRecoveryService.id;
        patch.serviceName = nextSlotRecoveryService.name;
        patch.servicePrice = Number(nextSlotRecoveryService.price);
        patch.serviceDurationMin = nextSlotRecoveryService.duration_min;

        nextDurationMin = nextSlotRecoveryService.duration_min;
      } else {
        patch.service = { disconnect: true };
        patch.slotRecoveryServiceId = null;
        patch.serviceName = null;
        patch.servicePrice = null;
        patch.serviceDurationMin = null;

        nextDurationMin = 30;
      }
    }

    if (startAt !== undefined) {
      const parsedStart = new Date(startAt);

      if (Number.isNaN(parsedStart.getTime())) {
        return NextResponse.json(
          { ok: false, error: "startAt inválido" },
          { status: 400 }
        );
      }

      start = parsedStart;
    }

    if (startAt !== undefined || slotRecoveryServiceId !== undefined || serviceId !== undefined) {
      end = new Date(start.getTime() + nextDurationMin * MS_MIN);
      patch.startAt = start;
      patch.endAt = end;
    }

    const allowedStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.BOOKED,
      AppointmentStatus.COMPLETED,
      AppointmentStatus.CANCELLED,
      AppointmentStatus.NO_SHOW,
    ];

    if (status && allowedStatuses.includes(status)) {
      patch.status = status;
    }

    if (notes !== undefined) {
      patch.notes = notes ?? null;
    }

    if (isUrgent !== undefined) {
      patch.isUrgent = Boolean(isUrgent);
    }

    if (customerName !== undefined) {
      patch.customerName = customerName ?? null;
    }

    if (customerPhone !== undefined) {
      patch.customerPhone = customerPhone ?? null;
    }

    if (customerEmail !== undefined) {
      patch.customerEmail = customerEmail ?? null;
    }

    if (customerId !== undefined) {
      if (customerId === null) {
        patch.customer = { disconnect: true };
      } else {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { id: true },
        });

        if (!customer) {
          return NextResponse.json(
            { ok: false, error: "Cliente no encontrado" },
            { status: 404 }
          );
        }

        await prisma.companyCustomer.upsert({
          where: {
            companyId_customerId: {
              companyId: appt.location.companyId,
              customerId,
            },
          },
          update: {},
          create: {
            companyId: appt.location.companyId,
            customerId,
          },
        });

        patch.customer = { connect: { id: customerId } };
      }
    }

    if (employeeId !== undefined) {
      if (employeeId) {
        const employeeLocation = await prisma.employeeLocation.findFirst({
          where: {
            locationId: appt.locationId,
            employeeId,
            visibleInLocation: true,
            employee: {
              active: true,
            },
          },
          select: { id: true },
        });

        if (!employeeLocation) {
          return NextResponse.json(
            { ok: false, error: "Empleado no disponible en esta clínica" },
            { status: 404 }
          );
        }

        const effectiveServiceId =
          nextSlotRecoveryService?.id ?? appt.slotRecoveryServiceId ?? null;

        if (effectiveServiceId) {
          const canDoService = await prisma.employee_service.findFirst({
            where: {
              employee_id: employeeId,
              service_id: effectiveServiceId,
            },
            select: { id: true },
          });

          if (!canDoService) {
            return NextResponse.json(
              { ok: false, error: "El empleado no realiza este servicio" },
              { status: 409 }
            );
          }
        }

        patch.employee = { connect: { id: employeeId } };
      } else {
        patch.employee = { disconnect: true };
      }
    }

    if (resourceId !== undefined) {
      if (resourceId) {
        patch.resource = { connect: { id: resourceId } };
      } else {
        patch.resource = { disconnect: true };
      }
    }

    const changedTime =
      startAt !== undefined ||
      slotRecoveryServiceId !== undefined ||
      serviceId !== undefined;

    const changedEmployee = employeeId !== undefined;
    const changedResource = resourceId !== undefined;

    if (changedTime || changedEmployee || changedResource) {
      const effectiveEmployeeId =
        employeeId !== undefined ? employeeId : appt.employeeId;

      const effectiveResourceId =
        resourceId !== undefined ? resourceId : appt.resourceId;

      const overlapBase: Prisma.AppointmentWhereInput = {
        id: { not: appt.id },
        locationId: appt.locationId,
        startAt: { lt: end },
        endAt: { gt: start },
        status: { in: ACTIVE_STATUSES },
      };

      if (effectiveEmployeeId) {
        const clash = await prisma.appointment.findFirst({
          where: {
            ...overlapBase,
            employeeId: effectiveEmployeeId,
          },
          select: { id: true },
        });

        if (clash) {
          return NextResponse.json(
            { ok: false, error: "El profesional ya tiene una cita en ese horario" },
            { status: 409 }
          );
        }
      }

      if (effectiveResourceId) {
        const clash = await prisma.appointment.findFirst({
          where: {
            ...overlapBase,
            resourceId: effectiveResourceId,
          },
          select: { id: true },
        });

        if (clash) {
          return NextResponse.json(
            { ok: false, error: "El recurso ya está ocupado en ese horario" },
            { status: 409 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: patch,
      });

      if (customerId !== undefined && customerId !== null) {
        await tx.slot_waitlist_entry.deleteMany({
          where: {
            location_id: appointment.locationId,
            customer_id: customerId,
            status: "active",
          },
        });
      }

      return appointment;
    });

    await updateGoogleEventForAppointment(updated.id);

    return NextResponse.json({
      ok: true,
      appointment: updated,
    });
  } catch (error: any) {
    console.error("[appointments.[id].PATCH] error", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertAppointmentAccess(id);

    if (!access.appointment) {
      return NextResponse.json(
        { ok: false, error: access.error },
        { status: access.status }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });

    return NextResponse.json({
      ok: true,
      appointment: updated,
    });
  } catch (error: any) {
    console.error("[appointments.[id].DELETE] error", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}