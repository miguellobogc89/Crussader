// app/api/calendar/appointments/cancelled/route.ts
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

async function getUserBySession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
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

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
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

const now = new Date();

const startOfToday = new Date(now);
startOfToday.setHours(0, 0, 0, 0);

const appointments = await prisma.appointment.findMany({
    where: {
        locationId,
        status: AppointmentStatus.CANCELLED,
        startAt: {
            gte: startOfToday,
        },
        slot_recovery_slot_slot_recovery_slot_source_appointment_idToAppointment: {
            none: {},
        },
    },
  select: {
    id: true,
    startAt: true,
    endAt: true,
    customerName: true,
    serviceName: true,
    employeeId: true,
    employee: {
      select: {
        name: true,
      },
    },
    updatedAt: true,
  },
  orderBy: {
    startAt: "asc",
  },
  take: 20,
});

    const items = appointments.map((a) => ({
      id: a.id,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      title: a.customerName || a.serviceName || "Cita cancelada",
      customerName: a.customerName,
      serviceName: a.serviceName,
      employeeId: a.employeeId,
      employeeName: a.employee?.name ?? null,
      source: "crussader",
      cancelledAt: a.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error: any) {
    console.error("[calendar.appointments.cancelled.GET]", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}