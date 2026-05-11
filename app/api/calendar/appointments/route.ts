// app/api/calendar/appointments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, LocationStatus, AppointmentStatus } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

let prisma: PrismaClient;

declare global {
  var _prisma: PrismaClient | undefined;
}

if (!global._prisma) {
  global._prisma = new PrismaClient();
}

prisma = global._prisma;

export const dynamic = "force-dynamic";

const GOOGLE_EVENT_COLORS: Record<string, string> = {
  "1": "#7986CB",
  "2": "#33B679",
  "3": "#8E24AA",
  "4": "#E67C73",
  "5": "#F6BF26",
  "6": "#F4511E",
  "7": "#039BE5",
  "8": "#616161",
  "9": "#3F51B5",
  "10": "#0B8043",
  "11": "#D50000",
};

const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.BOOKED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

async function getUserBySession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
}

async function assertLocationAccess(userId: string, locationId: string) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      companyId: true,
      status: true,
    },
  });

  if (!location || location.status !== LocationStatus.ACTIVE) {
    return null;
  }

  const [hasLocationAccess, hasCompanyAccess] = await Promise.all([
    prisma.userLocation.findFirst({
      where: { userId, locationId },
      select: { id: true },
    }),
    prisma.userCompany.findFirst({
      where: { userId, companyId: location.companyId },
      select: { id: true },
    }),
  ]);

  if (!hasLocationAccess && !hasCompanyAccess) {
    return null;
  }

  return location;
}

export async function GET(req: Request) {
  try {
    const user = await getUserBySession();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const fromISO = searchParams.get("from");
    const toISO = searchParams.get("to");

    if (!locationId || !fromISO || !toISO) {
      return NextResponse.json(
        { ok: false, error: "locationId, from y to son obligatorios" },
        { status: 400 }
      );
    }

    const location = await assertLocationAccess(user.id, locationId);

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const from = new Date(fromISO);
    const to = new Date(toISO);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      return NextResponse.json(
        { ok: false, error: "Rango de fechas inválido" },
        { status: 400 }
      );
    }

    const activeGoogleCalendars = await prisma.external_calendar_connection.findMany({
  where: {
    company_id: location.companyId,
    provider: "google-calendar",
    sync_enabled: true,
  },
  select: {
    external_calendar_id: true,
  },
});

const activeGoogleCalendarIds = activeGoogleCalendars
  .map((calendar) => calendar.external_calendar_id)
  .filter((id): id is string => Boolean(id));

    const appointments = await prisma.appointment.findMany({
      where: {
        locationId,
        startAt: { lt: to },
        endAt: { gt: from },
        status: { in: ACTIVE_STATUSES },
        OR: [
          {
            externalProvider: null,
          },
          {
            externalProvider: {
              not: "google-calendar",
            },
          },
          {
            externalProvider: "google-calendar",
            externalCalendarId: {
              in: activeGoogleCalendarIds,
            },
          },
        ],
      },
      select: {
        id: true,
        locationId: true,
        serviceId: true,
        slotRecoveryServiceId: true,
        startAt: true,
        endAt: true,
        status: true,
        employeeId: true,
        resourceId: true,
        customerId: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        notes: true,
        serviceName: true,
        servicePrice: true,
        serviceDurationMin: true,
        externalProvider: true,
        externalCalendarId: true,
        externalEventId: true,
        externalColor: true,

        service: {
          select: {
            name: true,
            color: true,
            durationMin: true,
            price: true,
          },
        },
        employee: {
          select: {
            name: true,
            color: true,
          },
        },
        resource: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ startAt: "asc" }],
    });



    return NextResponse.json({
      ok: true,
items: [
  ...appointments.map((appointment) => ({
    id: appointment.id,
    locationId: appointment.locationId,
    serviceId:
      appointment.serviceId ??
      appointment.slotRecoveryServiceId ??
      null,
    startAt: appointment.startAt.toISOString(),
    endAt: appointment.endAt.toISOString(),
    status: appointment.status,
    employeeId: appointment.employeeId,
    resourceId: appointment.resourceId,
    customerId: appointment.customerId,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    customerEmail: appointment.customerEmail,
    notes: appointment.notes,
    serviceName:
      appointment.serviceName ?? appointment.service?.name ?? null,
    serviceColor:
      appointment.service?.color ??
      appointment.externalColor ??
      null,

    employeeColor:
      appointment.employee?.color ??
      appointment.externalColor ??
      null,
    servicePrice:
      appointment.servicePrice ??
      (appointment.service?.price ? Number(appointment.service.price) : null),
    serviceDurationMin:
      appointment.serviceDurationMin ??
      appointment.service?.durationMin ??
      null,
    employeeName: appointment.employee?.name ?? null,
    resourceName: appointment.resource?.name ?? null,
    source: appointment.externalProvider === "google-calendar" ? "google" : "crussader",
    externalProvider: appointment.externalProvider,
    externalCalendarId: appointment.externalCalendarId,
    externalEventId: appointment.externalEventId,
  })),
],
    });
  } catch (error: any) {
    console.error("[calendar.appointments.GET]", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserBySession();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      locationId,
      serviceId,
      startAt,
      status,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      employeeId,
      resourceId,
      customerId,
    } = body ?? {};

    if (!locationId || !startAt || !customerId) {
      return NextResponse.json(
        { ok: false, error: "locationId, startAt y customerId son obligatorios" },
        { status: 400 }
      );
    }

    if (!serviceId && !employeeId) {
      return NextResponse.json(
        { ok: false, error: "Debes seleccionar al menos servicio o empleado" },
        { status: 400 }
      );
    }

    const location = await assertLocationAccess(user.id, locationId);

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const start = new Date(startAt);

    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { ok: false, error: "startAt inválido" },
        { status: 400 }
      );
    }

    let service: {
      id: string;
      name: string;
      duration_min: number;
      price: any;
    } | null = null;

    if (serviceId) {
      service = await prisma.slot_recovery_service.findFirst({
        where: {
          id: serviceId,
          company_id: location.companyId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          duration_min: true,
          price: true,
        },
      });

      if (!service) {
        return NextResponse.json(
          { ok: false, error: "Servicio no disponible" },
          { status: 404 }
        );
      }
    }

    if (employeeId) {
      const employeeLocation = await prisma.employeeLocation.findFirst({
        where: {
          locationId,
          employeeId,
          visibleInLocation: true,
          employee: {
            active: true,
          },
        },
        select: {
          id: true,
        },
      });

      if (!employeeLocation) {
        return NextResponse.json(
          { ok: false, error: "Empleado no disponible en esta clínica" },
          { status: 404 }
        );
      }

      if (serviceId) {
        const canDoService = await prisma.employee_service.findFirst({
          where: {
            employee_id: employeeId,
            service_id: serviceId,
          },
          select: {
            id: true,
          },
        });

        if (!canDoService) {
          return NextResponse.json(
            { ok: false, error: "El empleado no realiza este servicio" },
            { status: 409 }
          );
        }
      }
    }

    const durationMin = service?.duration_min ?? 30;
    const end = new Date(start.getTime() + durationMin * 60_000);

    if (employeeId) {
      const clash = await prisma.appointment.findFirst({
        where: {
          locationId,
          employeeId,
          startAt: { lt: end },
          endAt: { gt: start },
          status: { in: ACTIVE_STATUSES },
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

    if (resourceId) {
      const clash = await prisma.appointment.findFirst({
        where: {
          locationId,
          resourceId,
          startAt: { lt: end },
          endAt: { gt: start },
          status: { in: ACTIVE_STATUSES },
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

    const created = await prisma.$transaction(async (tx) => {
      await tx.companyCustomer.upsert({
        where: {
          companyId_customerId: {
            companyId: location.companyId,
            customerId,
          },
        },
        update: {},
        create: {
          companyId: location.companyId,
          customerId,
        },
      });

      const safeStatus = Object.values(AppointmentStatus).includes(status)
        ? status
        : AppointmentStatus.BOOKED;

      const appointment = await tx.appointment.create({
        data: {
          locationId,
          serviceId: null,
          slotRecoveryServiceId: service?.id ?? null,
          startAt: start,
          endAt: end,
          status: safeStatus,
          employeeId: employeeId || null,
          resourceId: resourceId || null,
          customerId,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          notes: notes || null,
          serviceName: service?.name ?? null,
          servicePrice: service ? Number(service.price) : null,
          serviceDurationMin: service?.duration_min ?? null,
        },
        select: {
          id: true,
          locationId: true,
          customerId: true,
          startAt: true,
          endAt: true,
          status: true,
        },
      });

      await tx.slot_waitlist_entry.deleteMany({
        where: {
          location_id: appointment.locationId,
          customer_id: appointment.customerId,
          status: "active",
        },
      });

      return appointment;
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...created,
        startAt: created.startAt.toISOString(),
        endAt: created.endAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[calendar.appointments.POST]", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}