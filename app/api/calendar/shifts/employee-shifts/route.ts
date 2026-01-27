// app/api/calendar/shifts/employee-shifts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDateOnly(v: string | null): Date | null {
  if (!v) return null;
  // acepta "YYYY-MM-DD"
  const d = new Date(v + "T00:00:00.000Z");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!locationId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros: locationId, from, to" },
        { status: 400 }
      );
    }

    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { ok: false, error: "from/to inválidos (usa YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // rango inclusivo [from 00:00, to 23:59:59.999]
    const toEnd = new Date(toDate);
    toEnd.setUTCHours(23, 59, 59, 999);

    const rows = await prisma.employeeShift.findMany({
      where: {
        locationId: String(locationId),
        startAt: { gte: fromDate, lte: toEnd },
      },
      orderBy: [{ startAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        companyId: true,
        locationId: true,
        employeeId: true,
        startAt: true,
        endAt: true,
        type: true,
        label: true,
        color: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ dedupe por “identidad funcional” del turno (ignora id)
    const seen = new Set<string>();
    const items: typeof rows = [];

    for (const r of rows) {
      const key = [
        r.locationId,
        r.employeeId,
        r.startAt.toISOString(),
        r.endAt.toISOString(),
        String(r.type),
        String(r.label ?? ""),
        String(r.color ?? ""),
      ].join("|");

      if (seen.has(key)) continue;
      seen.add(key);
      items.push(r);
    }

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (e: any) {
    console.error("[employee-shifts GET] error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}
