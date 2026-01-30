// app/api/calendar/shift-events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ---- helpers TZ (Europe/Madrid) ----
function parseYMD(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return { y, mo, d };
}

function offsetMsForTZAtUTC(tz: string, utcDate: Date): number {
  // Node/Intl: timeZoneName: 'shortOffset' -> "GMT+1", "GMT+2"
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = fmt.formatToParts(utcDate);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";

  const mm = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(tzName);
  if (!mm) return 0;

  const sign = mm[1] === "-" ? -1 : 1;
  const hh = Number(mm[2]);
  const mins = mm[3] ? Number(mm[3]) : 0;

  const total = sign * (hh * 60 + mins);
  return total * 60 * 1000;
}

function zonedYmdMinToUTCDate(ymd: string, minutesFromMidnight: number, tz: string): Date {
  const p = parseYMD(ymd);
  if (!p) return new Date("Invalid");

  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;

  // 1) guess as if that wall time were UTC
  const guessUTC = new Date(Date.UTC(p.y, p.mo - 1, p.d, h, m, 0, 0));
  // 2) compute real offset for that instant in the target TZ
  const off = offsetMsForTZAtUTC(tz, guessUTC);
  // 3) shift back by offset to get correct UTC time
  return new Date(Date.UTC(p.y, p.mo - 1, p.d, h, m, 0, 0) - off);
}

// ---- kind mapping (tu enum tiene OFF, no CLEAR) ----
function normalizeKind(input: string | null | undefined) {
  const k = String(input ?? "").toUpperCase();

  if (k === "WORK") return "WORK";
  if (k === "VACATION") return "VACATION";
  if (k === "SICK") return "SICK";

  // UI "CLEAR" => en BBDD usamos OFF (o simplemente no crearíamos nada, pero por ahora lo mapeo)
  if (k === "CLEAR") return "OFF";
  if (k === "OFF") return "OFF";

  // fallback seguro
  return "WORK";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session as any)?.user?.companyId ?? null;

    const { searchParams } = new URL(req.url);

    const locationId = searchParams.get("locationId");
    const employeeId = searchParams.get("employeeId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!companyId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "companyId (sesión), from y to son obligatorios" },
        { status: 400 }
      );
    }

    const events = await prisma.shiftEvent.findMany({
      where: {
        companyId,
        ...(locationId ? { locationId } : {}),
        ...(employeeId ? { employeeId } : {}),
        startAt: { lt: new Date(`${to}T23:59:59.999Z`) },
        endAt: { gt: new Date(`${from}T00:00:00.000Z`) },
      },
      select: {
        id: true,
        employeeId: true,
        locationId: true,
        startAt: true,
        endAt: true,
        kind: true,
        label: true,
        templateId: true,
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ ok: true, items: events });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session as any)?.user?.companyId ?? null;

    const body = await req.json().catch(() => null);

    const locationId = body?.locationId ? String(body.locationId) : null;
    const employeeIdsRaw = Array.isArray(body?.employeeIds) ? body.employeeIds : [];
    const employeeIds = employeeIdsRaw.map((x: any) => String(x)).filter(Boolean);

    const dayISO = body?.dayISO ? String(body.dayISO) : null; // "YYYY-MM-DD"
    const startMin = Number(body?.startMin);
    const endMin = Number(body?.endMin);

    const kind = normalizeKind(body?.kind);
    const label = body?.label ? String(body.label) : null;
    const templateId = body?.templateId ? String(body.templateId) : null;

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "Sin companyId en sesión" }, { status: 401 });
    }

    if (!locationId || !dayISO || !Number.isFinite(startMin) || !Number.isFinite(endMin)) {
      return NextResponse.json(
        { ok: false, error: "locationId, dayISO, startMin, endMin son obligatorios" },
        { status: 400 }
      );
    }

    if (employeeIds.length === 0) {
      return NextResponse.json({ ok: false, error: "employeeIds vacío" }, { status: 400 });
    }

    if (endMin <= startMin) {
      return NextResponse.json({ ok: false, error: "endMin debe ser > startMin" }, { status: 400 });
    }

    const tz = "Europe/Madrid";
    const startAt = zonedYmdMinToUTCDate(dayISO, startMin, tz);
    const endAt = zonedYmdMinToUTCDate(dayISO, endMin, tz);

    if (Number.isNaN(+startAt) || Number.isNaN(+endAt)) {
      return NextResponse.json({ ok: false, error: "dayISO inválido" }, { status: 400 });
    }

    // Si es OFF (CLEAR), por ahora simplemente no creamos nada (borrado lo haremos luego bien).
    if (kind === "OFF") {
      return NextResponse.json({ ok: true, items: [], skipped: true });
    }

    // Creamos un ShiftEvent por empleado
    const created = await prisma.$transaction(async (tx) => {
      const items = [];

      for (const employeeId of employeeIds) {
        const row = await tx.shiftEvent.create({
          data: {
            companyId,
            locationId,
            employeeId,
            startAt,
            endAt,
            kind: kind as any, // Prisma enum type
            label,
            templateId,
          },
          select: {
            id: true,
            employeeId: true,
            locationId: true,
            startAt: true,
            endAt: true,
            kind: true,
            label: true,
            templateId: true,
          },
        });

        items.push(row);
      }

      return items;
    });

    return NextResponse.json({ ok: true, items: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
