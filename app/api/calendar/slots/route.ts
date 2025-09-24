import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== Helpers de tiempo =====
const MS = {
  min: 60_000,
  day: 86_400_000,
};

function toDateUTC(dateStr: string, timeHHMM: string) {
  // Construye un Date UTC con "YYYY-MM-DD" + "HH:MM"
  return new Date(`${dateStr}T${timeHHMM}:00.000Z`);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function addMinutes(d: Date, min: number) {
  return new Date(d.getTime() + min * MS.min);
}

// Lee Location.openingHours (JSON) con formato:
// { mon:[["09:00","14:00"],["16:00","20:00"]], tue: [...], ... } en hora local.
// Si no existe, usa 09:00-18:00
function getOpeningWindows(openingHours: any, dateISO: string) {
  const wd = new Date(dateISO + "T00:00:00.000Z").getUTCDay(); // 0-6 (0=Domingo)
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const key = map[wd];
  const spans: Array<[string, string]> =
    openingHours?.[key] ??
    [
      ["09:00", "18:00"],
    ];
  return spans.map(([start, end]) => ({
    start: toDateUTC(dateISO, start),
    end: toDateUTC(dateISO, end),
  }));
}

type Slot = {
  startAt: string;       // ISO
  endAt: string;         // ISO
  employeeIds: string[]; // candidatos libres
  resourceIds: string[]; // candidatos libres (si hay requisito de recurso)
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD (UTC)
  const stepMinParam = searchParams.get("stepMin"); // ej. 15

  if (!locationId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const stepMin = Math.max(5, Math.min(60, Number(stepMinParam ?? 15)));

  try {
    // 1) Cargar Service + Location (para horarios)
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        locationId: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        requiredRoleId: true,
        requiredResourceTagId: true,
        location: {
          select: {
            openingHours: true,
          },
        },
      },
    });
    if (!service || service.locationId !== locationId) {
      return NextResponse.json({ error: "Service not found in location" }, { status: 404 });
    }

    const dayStart = new Date(dateStr + "T00:00:00.000Z");
    const dayEnd = new Date(dateStr + "T23:59:59.999Z");
    const serviceWindowMin = service.durationMin + (service.bufferBeforeMin ?? 0) + (service.bufferAfterMin ?? 0);

    // 2) Empleados elegibles en la sede (visibles) y con rol requerido (si aplica)
    const employeeLinks = await prisma.employeeLocation.findMany({
      where: { locationId, visibleInLocation: true },
      select: { employeeId: true, employee: { select: { id: true } } },
    });
    const employeeIdsInLocation = employeeLinks.map((l) => l.employeeId);

    let eligibleEmployeeIds = employeeIdsInLocation;
    if (service.requiredRoleId) {
      const withRole = await prisma.employeeRole.findMany({
        where: { roleId: service.requiredRoleId, employeeId: { in: employeeIdsInLocation } },
        select: { employeeId: true },
      });
      const set = new Set(withRole.map((r) => r.employeeId));
      eligibleEmployeeIds = eligibleEmployeeIds.filter((id) => set.has(id));
    }

    // 3) Recursos elegibles (si el Service requiere un tag)
    let eligibleResourceIds: string[] | null = null;
    if (service.requiredResourceTagId) {
      const tagged = await prisma.resourceTagOnResource.findMany({
        where: { tag: { id: service.requiredResourceTagId } },
        select: { resourceId: true, resource: { select: { locationId: true, active: true } } },
      });
      eligibleResourceIds = tagged
        .filter((t) => t.resource.locationId === locationId && t.resource.active)
        .map((t) => t.resourceId);
    }

    // 4) Ocupación del día: Citas + Ausencias
    const [appointments, employeeBlocks, resourceBlocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          locationId,
          status: { in: ["BOOKED", "PENDING"] },
          OR: [
            { startAt: { gte: dayStart, lte: dayEnd } },
            { endAt: { gte: dayStart, lte: dayEnd } },
          ],
        },
        select: { id: true, startAt: true, endAt: true, employeeId: true, resourceId: true },
      }),
      prisma.employeeTimeOff.findMany({
        where: {
          locationId,
          OR: [
            { startAt: { gte: dayStart, lte: dayEnd } },
            { endAt: { gte: dayStart, lte: dayEnd } },
          ],
        },
        select: { id: true, startAt: true, endAt: true, employeeId: true },
      }),
      prisma.resourceTimeOff.findMany({
        where: {
          locationId,
          OR: [
            { startAt: { gte: dayStart, lte: dayEnd } },
            { endAt: { gte: dayStart, lte: dayEnd } },
          ],
        },
        select: { id: true, startAt: true, endAt: true, resourceId: true },
      }),
    ]);

    // 5) Construir ventanas de apertura del día
    const windows = getOpeningWindows(service.location.openingHours, dateStr);

    // Pre-catalogar ocupación por empleado/recurso
    const busyByEmployee = new Map<string, Array<{ s: Date; e: Date }>>();
    const busyByResource = new Map<string, Array<{ s: Date; e: Date }>>();

    const pushBusy = (map: Map<string, Array<{ s: Date; e: Date }>>, key: string, s: Date, e: Date) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ s, e });
    };

    // Citas
    for (const a of appointments) {
      if (a.employeeId) pushBusy(busyByEmployee, a.employeeId, a.startAt, a.endAt);
      if (a.resourceId) pushBusy(busyByResource, a.resourceId, a.startAt, a.endAt);
    }
    // Ausencias empleado
    for (const b of employeeBlocks) {
      pushBusy(busyByEmployee, b.employeeId, b.startAt, b.endAt);
    }
    // Bloqueos recurso
    for (const b of resourceBlocks) {
      pushBusy(busyByResource, b.resourceId, b.startAt, b.endAt);
    }

    // 6) Generar slots candidatos
    const slots: Slot[] = [];
    for (const w of windows) {
      // Avanzamos en granulado stepMin
      for (let t = w.start.getTime(); t + service.durationMin * MS.min <= w.end.getTime(); t += stepMin * MS.min) {
        const start = new Date(t);
        const end = addMinutes(start, service.durationMin);

        // Para buffers, bloqueamos también el antes/después
        const blockStart = addMinutes(start, -(service.bufferBeforeMin ?? 0));
        const blockEnd = addMinutes(end, service.bufferAfterMin ?? 0);

        // Empleados libres
        const freeEmployees = eligibleEmployeeIds.filter((empId) => {
          const busy = busyByEmployee.get(empId) ?? [];
          for (const b of busy) {
            if (overlaps(blockStart, blockEnd, b.s, b.e)) return false;
          }
          return true;
        });

        if (freeEmployees.length === 0) continue;

        // Recursos libres (si aplica)
        let freeResources: string[] = [];
        if (eligibleResourceIds) {
          freeResources = eligibleResourceIds.filter((resId) => {
            const busy = busyByResource.get(resId) ?? [];
            for (const b of busy) {
              if (overlaps(blockStart, blockEnd, b.s, b.e)) return false;
            }
            return true;
          });
          if (freeResources.length === 0) continue; // requiere recurso y no hay
        }

        slots.push({
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          employeeIds: freeEmployees,
          resourceIds: eligibleResourceIds ? freeResources : [],
        });
      }
    }

    // 7) Respuesta
    return NextResponse.json({
      locationId,
      serviceId,
      date: dateStr,
      stepMin,
      durationMin: service.durationMin,
      bufferBeforeMin: service.bufferBeforeMin ?? 0,
      bufferAfterMin: service.bufferAfterMin ?? 0,
      requiredRoleId: service.requiredRoleId,
      requiredResourceTagId: service.requiredResourceTagId,
      slots,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
