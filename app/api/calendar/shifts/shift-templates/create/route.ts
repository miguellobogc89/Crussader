// app/api/calendar/shifts/shift-templates/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

function isId(v: unknown) {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (s.length < 8) return false;
  if (s.length > 80) return false;
  return true;
}

function clampInt(n: unknown, min: number, max: number) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  const i = Math.floor(x);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

export async function GET() {
  return NextResponse.json({ ok: true, ping: "shift-templates-create" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const locationId = body?.locationId;
    const rawName = typeof body?.name === "string" ? body.name.trim() : "";
    const name = rawName.replace(/\s+/g, " ");
    const startMin = clampInt(body?.startMin, 0, 1439);
    const endMin = clampInt(body?.endMin, 0, 1439);

    if (!isId(locationId)) {
      return NextResponse.json({ ok: false, error: "locationId inválido" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });
    }
    if (endMin <= startMin) {
      return NextResponse.json(
        { ok: false, error: "El fin debe ser mayor que el inicio" },
        { status: 400 }
      );
    }

    // companyId derivado desde Location
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, companyId: true },
    });

    if (!loc) {
      return NextResponse.json({ ok: false, error: "Location no encontrada" }, { status: 404 });
    }

    const created = await prisma.locationShiftTemplate.create({
      data: {
        companyId: loc.companyId,
        locationId: loc.id,
        name,
        startMin,
        endMin,
        kind: "WORK",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        startMin: true,
        endMin: true,
        color: true,
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Ya existe un turno con ese nombre en esta ubicación" },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: "Error creando turno" }, { status: 500 });
  }
}
