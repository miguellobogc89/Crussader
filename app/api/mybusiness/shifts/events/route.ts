// app/api/mybusiness/shifts/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { getBootstrapData } from "@/lib/bootstrap";
import { shift_event_kind } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/mybusiness/shifts/events
 *
 * Query params:
 *  - start: ISO date (inicio rango, incl.)
 *  - end:   ISO date (fin rango, excl.)
 *  - employeeIds: "id1,id2,id3" (opcional)
 *
 * Filtra SIEMPRE por companyId = activeCompany.id
 */
export async function GET(req: NextRequest) {
  try {
    const { activeCompany } = await getBootstrapData();
    const companyId = activeCompany?.id;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "No active company" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");
    const employeeIdsParam = url.searchParams.get("employeeIds");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startParam) {
      const d = new Date(startParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { ok: false, error: "Invalid 'start' param" },
          { status: 400 }
        );
      }
      startDate = d;
    }

    if (endParam) {
      const d = new Date(endParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { ok: false, error: "Invalid 'end' param" },
          { status: 400 }
        );
      }
      endDate = d;
    }

    const employeeIds = employeeIdsParam
      ? employeeIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const where: any = { companyId };

    if (startDate && endDate) {
      where.startAt = { gte: startDate, lt: endDate };
    } else if (startDate) {
      where.startAt = { gte: startDate };
    } else if (endDate) {
      where.startAt = { lt: endDate };
    }

    if (employeeIds.length > 0) {
      where.employeeId = { in: employeeIds };
    }

    const rows = await prisma.shiftEvent.findMany({
      where,
      orderBy: { startAt: "asc" },
    });

    const items = rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      locationId: r.locationId,
      employeeId: r.employeeId,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      kind: r.kind,
      label: r.label,
    }));

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: any) {
    console.error("GET /shifts/events error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

/** Tipo de evento que esperamos desde el frontend para autosave */
type IncomingShiftEvent = {
  id?: string; // opcional, por si luego quieres soportar updates finos
  employeeId: string;
  startAt: string; // ISO
  endAt: string;   // ISO
  kind: shift_event_kind;
  label?: string | null;
  locationId?: string | null;
};

/** POST /api/mybusiness/shifts/events
 *
 * Body JSON:
 * {
 *   "employeeId": "emp_123",
 *   "rangeStart": "2025-11-10T00:00:00.000Z",
 *   "rangeEnd":   "2025-11-17T00:00:00.000Z",
 *   "events": [
 *      { startAt, endAt, kind, label?, locationId? },
 *      ...
 *   ]
 * }
 *
 * Estrategia:
 *  - Se identifica companyId desde bootstrap (activeCompany).
 *  - Se borra TODO lo de ese employeeId en [rangeStart, rangeEnd) para esa company.
 *  - Se crean los eventos recibidos.
 *
 * Pensado para autosave por semana + empleado.
 */
export async function POST(req: NextRequest) {
  try {
    const { activeCompany } = await getBootstrapData();
    const companyId = activeCompany?.id;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "No active company" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      employeeId,
      rangeStart,
      rangeEnd,
      events,
    }: {
      employeeId?: string;
      rangeStart?: string;
      rangeEnd?: string;
      events?: IncomingShiftEvent[];
    } = body ?? {};

    if (!employeeId || typeof employeeId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid 'employeeId'" },
        { status: 400 }
      );
    }

    if (!rangeStart || !rangeEnd) {
      return NextResponse.json(
        { ok: false, error: "Missing 'rangeStart' or 'rangeEnd'" },
        { status: 400 }
      );
    }

    const startDate = new Date(rangeStart);
    const endDate = new Date(rangeEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date range" },
        { status: 400 }
      );
    }

    const safeEvents: IncomingShiftEvent[] = Array.isArray(events)
      ? events
          .filter((e): e is IncomingShiftEvent => !!e && !!e.startAt && !!e.endAt)
          .map((e) => ({
            employeeId,
            kind: e.kind,
            startAt: e.startAt,
            endAt: e.endAt,
            label: e.label ?? null,
            locationId: e.locationId ?? null,
          }))
      : [];

    await prisma.$transaction(async (tx) => {
      // 1) Borramos los eventos existentes en ese rango para ese empleado + company
      await tx.shiftEvent.deleteMany({
        where: {
          companyId,
          employeeId,
          startAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      // 2) Insertamos los nuevos (si hay)
      if (safeEvents.length > 0) {
        await tx.shiftEvent.createMany({
          data: safeEvents.map((e) => ({
            companyId,
            employeeId: e.employeeId,
            locationId: e.locationId,
            startAt: new Date(e.startAt),
            endAt: new Date(e.endAt),
            kind: e.kind,
            label: e.label,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("POST /shifts/events error:", err);
    const msg = err?.message ?? "Internal error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
