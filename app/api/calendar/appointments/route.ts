// app/api/calendar/appointments/route.ts

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

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") ?? "";
    const fromISO = searchParams.get("from");
    const toISO = searchParams.get("to");
    if (!locationId || !fromISO || !toISO) {
      return NextResponse.json({ ok: false, error: "locationId, from y to son obligatorios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    // Validar acceso a la location (por location o por company)
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, status: true, companyId: true },
    });
    if (!loc || loc.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ ok: true, items: [] });
    }
    if (!isAdmin) {
      const [hasLoc, hasCompany] = await Promise.all([
        prisma.userLocation.findFirst({ where: { userId: user.id, locationId } }),
        prisma.userCompany.findFirst({ where: { userId: user.id, companyId: loc.companyId } }),
      ]);
      if (!hasLoc && !hasCompany) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const from = new Date(fromISO);
    const to = new Date(toISO);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from >= to) {
      return NextResponse.json({ ok: false, error: "Rango de fechas inválido" }, { status: 400 });
    }

    // Overlap en el rango (no solo “dentro de”)
    const appts = await prisma.appointment.findMany({
      where: {
        locationId,
        startAt: { lt: to },
        endAt: { gt: from },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.BOOKED, AppointmentStatus.COMPLETED] },
      },
  select: {
    id: true,
    locationId: true,
    serviceId: true,
    startAt: true,
    endAt: true,
    status: true,
    employeeId: true,
    resourceId: true,
    customerName: true,
    customerPhone: true,
    customerEmail: true,
    notes: true,

    service: { select: { name: true, color: true } },
    employee: { select: { name: true } },
    resource: { select: { name: true } },
  },
  orderBy: [{ startAt: "asc" }],
});

    // Shape plano + fechas en ISO string
    const items = appts.map(a => ({
      id: a.id,
      locationId: a.locationId,
      serviceId: a.serviceId,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      status: a.status,
      employeeId: a.employeeId,
      resourceId: a.resourceId,
      customerName: a.customerName ?? null,
      customerPhone: a.customerPhone ?? null,
      customerEmail: a.customerEmail ?? null,
      notes: a.notes ?? null,
  serviceName: a.service?.name ?? null,
  serviceColor: a.service?.color ?? null,
  employeeName: a.employee?.name ?? null,
  resourceName: a.resource?.name ?? null,
    }));

    return NextResponse.json({ ok: true, items });
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

      // NUEVO: relación con cliente
      customerId,
      customer, // { firstName, lastName, phone, email? }
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

    // =========================
    // NUEVO: Resolver/crear cliente y vincular a la company
    // =========================
    let resolvedCustomerId: string | null = null;
    let resolvedName: string | null = customerName ?? null;
    let resolvedPhone: string | null = customerPhone ?? null;
    let resolvedEmail: string | null = (customerEmail || null) as string | null;

    await prisma.$transaction(async (tx) => {
      if (customerId) {
        // Asegurar vínculo N:M con company
        await tx.companyCustomer.upsert({
          where: { companyId_customerId: { companyId: loc.companyId, customerId } },
          update: {},
          create: { companyId: loc.companyId, customerId },
        });
        resolvedCustomerId = customerId;

        // Completar datos visuales si no vinieron en body
        if (!resolvedName || !resolvedPhone || !resolvedEmail) {
          const c = await tx.customer.findUnique({
            where: { id: customerId },
            select: { firstName: true, lastName: true, phone: true, email: true },
          });
          if (c) {
            if (!resolvedName) resolvedName = `${c.firstName} ${c.lastName}`.trim();
            if (!resolvedPhone) resolvedPhone = c.phone ?? null;
            if (!resolvedEmail) resolvedEmail = c.email ?? null;
          }
        }
      } else if (customer?.firstName && customer?.lastName && customer?.phone) {
        const emailNorm = (customer.email || "").trim().toLowerCase();
        const phoneNorm = customer.phone.trim();

        const existing = await tx.customer.findFirst({
          where: {
            OR: [
              ...(emailNorm ? [{ email: emailNorm }] : []),
              ...(phoneNorm ? [{ phone: phoneNorm }] : []),
            ],
          },
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        });

        if (existing) {
          resolvedCustomerId = existing.id;
          // Usar datos del existente si no vinieron en body
          if (!resolvedName) resolvedName = `${existing.firstName} ${existing.lastName}`.trim();
          if (!resolvedPhone) resolvedPhone = existing.phone ?? null;
          if (!resolvedEmail) resolvedEmail = existing.email ?? null;
        } else {
          const created = await tx.customer.create({
            data: {
              firstName: customer.firstName.trim(),
              lastName: customer.lastName.trim(),
              phone: phoneNorm,
              email: emailNorm || null,
            },
            select: { id: true, firstName: true, lastName: true, phone: true, email: true },
          });
          resolvedCustomerId = created.id;
          if (!resolvedName) resolvedName = `${created.firstName} ${created.lastName}`.trim();
          if (!resolvedPhone) resolvedPhone = created.phone ?? null;
          if (!resolvedEmail) resolvedEmail = created.email ?? null;
        }

        // Vincular a la company
        await tx.companyCustomer.upsert({
          where: { companyId_customerId: { companyId: loc.companyId, customerId: resolvedCustomerId } },
          update: {},
          create: { companyId: loc.companyId, customerId: resolvedCustomerId },
        });
      } else {
        // Back-compat: si no hay customerId ni bloque customer, seguimos con los campos sueltos
        // (customerName/Phone/Email ya vienen en el body)
      }

      // =========================
      // Crear la cita (con FK y campos "plano" para la UI actual)
      // =========================
      const safeStatus: AppointmentStatus =
        Object.values(AppointmentStatus).includes(status) ? status : AppointmentStatus.BOOKED;

      const created = await tx.appointment.create({
        data: {
          locationId,
          serviceId,
          startAt: start,
          endAt: end,
          status: safeStatus,
          employeeId: employeeId || null,
          resourceId: resourceId || null,

          // NUEVO: FK a Customer
          customerId: resolvedCustomerId,

          // Back-compat para tu UI actual
          customerName: resolvedName || null,
          customerPhone: resolvedPhone || null,
          customerEmail: resolvedEmail || null,

          notes: notes || null,
        },
        select: { id: true, startAt: true, endAt: true, status: true },
      });

      // Respuesta
      return created;
    });

    // Nota: la transacción devuelve el último "return created"; pero como no lo capturamos fuera,
    // hacemos una ligera consulta para responder igual que antes (opcional)
    // Para mantener tu shape actual:
    const createdLookup = await prisma.appointment.findFirst({
      where: { locationId, startAt: start, endAt: end },
      select: { id: true, startAt: true, endAt: true, status: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ ok: true, item: createdLookup });
  } catch (err: any) {
    console.error("[calendar.appointments.POST] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

