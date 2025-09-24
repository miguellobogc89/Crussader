import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  PrismaClient,
  LocationStatus,
  AppointmentStatus,
} from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

/* =========================
 * GET /api/calendar/appointments?date=YYYY-MM-DD&locationId=...
 * - Si falta locationId, usa la primera location accesible del usuario.
 * - date: día concreto (por defecto hoy, en UTC; ajusta si quieres TZ luego)
 * Devuelve: { ok, items: [{ id, date, startAt, endAt, service, comment, employees, resources }] }
 * ========================= */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    let locationId = searchParams.get("locationId") || "";

    // Resolver locationId si no viene: primera accesible (UserLocation o UserCompany)
    if (!locationId) {
      // directas
      const direct = await prisma.userLocation.findMany({
        where: { userId: user.id, location: { status: LocationStatus.ACTIVE } },
        select: { locationId: true },
        take: 1,
      });
      if (direct.length) locationId = direct[0].locationId;

      if (!locationId) {
        const comps = await prisma.userCompany.findMany({
          where: { userId: user.id },
          select: { companyId: true },
        });
        const compIds = comps.map(c => c.companyId);
        if (compIds.length) {
          const loc = await prisma.location.findFirst({
            where: { companyId: { in: compIds }, status: LocationStatus.ACTIVE },
            select: { id: true },
            orderBy: { title: "asc" },
          });
          if (loc) locationId = loc.id;
        }
      }
    }

    if (!locationId) {
      return NextResponse.json({ ok: true, items: [], meta: { locationId: null } });
    }

    // Validar acceso a esa location
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, status: true, companyId: true },
    });
    if (!loc || loc.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ ok: true, items: [], meta: { locationId } });
    }

    const [directAccess, companyAccess] = await Promise.all([
      prisma.userLocation.findFirst({ where: { userId: user.id, locationId } }),
      prisma.userCompany.findFirst({ where: { userId: user.id, companyId: loc.companyId } }),
    ]);
    if (!directAccess && !companyAccess) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Rango del día (UTC simple por ahora)
    const baseDate = dateStr ? new Date(dateStr + "T00:00:00.000Z") : new Date();
    const dayStart = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 23, 59, 59, 999));

    const appts = await prisma.appointment.findMany({
      where: {
        locationId,
        startAt: { gte: dayStart, lte: dayEnd },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED] },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        notes: true,
        customerName: true,
        employee: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, durationMin: true } },
      },
      orderBy: [{ startAt: "asc" }],
    });

    // Mapear al shape pedido (comentario vacío por ahora)
    const items = appts.map(a => ({
      id: a.id,
      date: a.startAt.toISOString().slice(0,10), // YYYY-MM-DD
      startAt: a.startAt,
      endAt: a.endAt,
      service: a.service ? { id: a.service.id, name: a.service.name, durationMin: a.service.durationMin } : null,
      comment: "", // pedido: campo "comentario" vacío de momento
      employees: a.employee ? [{ id: a.employee.id, name: a.employee.name }] : [],
      resources: a.resource ? [{ id: a.resource.id, name: a.resource.name }] : [],
      // extra útil para depurar:
      customerName: a.customerName ?? null,
      notes: a.notes ?? null,
    }));

    return NextResponse.json({ ok: true, items, meta: { locationId, date: items[0]?.date || dateStr || null } });
  } catch (err: any) {
    console.error("[calendar.appointments.GET] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

/* =========================
 * POST (igual que te dejé antes)
 * - calcula endAt con duración + buffers
 * - valida acceso
 * - bloqueos básicos de solape (si mandas employeeId/resourceId)
 * ========================= */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

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
    } = body ?? {};

    if (!locationId || !serviceId || !startAt) {
      return NextResponse.json({ ok: false, error: "locationId, serviceId y startAt son obligatorios" }, { status: 400 });
    }

    const start = new Date(startAt);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ ok: false, error: "startAt no es una fecha válida" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, status: true, companyId: true },
    });
    if (!loc || loc.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ ok: false, error: "Location no disponible" }, { status: 404 });
    }

    const [directAccess, companyAccess] = await Promise.all([
      prisma.userLocation.findFirst({ where: { userId: user.id, locationId } }),
      prisma.userCompany.findFirst({ where: { userId: user.id, companyId: loc.companyId } }),
    ]);
    if (!directAccess && !companyAccess) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

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

    const totalMinutes =
      (service.durationMin ?? 0) +
      (service.bufferBeforeMin ?? 0) +
      (service.bufferAfterMin ?? 0);
    const end = new Date(start.getTime() + totalMinutes * 60 * 1000);

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
        return NextResponse.json({ ok: false, error: "El profesional ya tiene una cita en ese horario" }, { status: 409 });
      }
    }

    if (resourceId) {
      const clashResource = await prisma.appointment.findFirst({
        where: { resourceId, ...overlapWhereBase },
        select: { id: true },
      });
      if (clashResource) {
        return NextResponse.json({ ok: false, error: "El recurso/sala ya está ocupado en ese horario" }, { status: 409 });
      }
    }

    const safeStatus: AppointmentStatus =
      Object.values(AppointmentStatus).includes(status) ? status : AppointmentStatus.BOOKED;

    const created = await prisma.appointment.create({
      data: {
        locationId,
        serviceId,
        startAt: start,
        endAt: end,
        status: safeStatus,
        employeeId: employeeId || null,
        resourceId: resourceId || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        customerEmail: customerEmail || null,
        notes: notes || null,
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    console.error("[calendar.appointments.POST] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
