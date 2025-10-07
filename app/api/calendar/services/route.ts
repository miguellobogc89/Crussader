// app/api/calendar/services/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, LocationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

/** Helpers de acceso */
async function getUserIdFromSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}
async function assertLocationAccess(userId: string, locationId: string) {
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, companyId: true, status: true },
  });
  if (!loc || loc.status !== LocationStatus.ACTIVE) return { allowed: false, loc: null };

  const [directAccess, companyAccess] = await Promise.all([
    prisma.userLocation.findFirst({ where: { userId, locationId } }),
    prisma.userCompany.findFirst({ where: { userId, companyId: loc.companyId } }),
  ]);
  if (!directAccess && !companyAccess) return { allowed: false, loc };
  return { allowed: true, loc };
}

// ===== GET =====
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") || "";
    if (!locationId) return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });

    const { allowed, loc } = await assertLocationAccess(userId, locationId);
    if (!allowed) {
      // si la location existe pero no está activa, respondemos vacío; si es falta de permisos, 403
      if (!loc) return NextResponse.json({ ok: true, items: [] });
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const services = await prisma.service.findMany({
      where: { locationId, active: true },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        color: true,
        active: true,
        // priceCents: true, // descomenta cuando lo tengas en DB
        // price: true,      // alternativa si usas decimal
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ ok: true, items: services });
  } catch (err: any) {
    console.error("[calendar.services] GET error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

// ===== POST (crear) =====
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const locationId = String(body?.locationId || "");
    const name = String(body?.name || "").trim();
    if (!locationId) return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });
    if (!name) return NextResponse.json({ ok: false, error: "name is required" }, { status: 400 });

    const { allowed } = await assertLocationAccess(userId, locationId);
    if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const data: any = {
      locationId,
      name,
      description: typeof body?.description === "string" ? body.description : null,
      durationMin: Number.isFinite(Number(body?.durationMin)) ? Number(body.durationMin) : 30,
      color: body?.color ? String(body.color) : null,
      active: typeof body?.active === "boolean" ? !!body.active : true,
    };

    // Precio (elige uno: priceCents o price decimal)
    if (typeof body?.priceCents === "number") data.priceCents = Math.max(0, Math.round(body.priceCents));
    if (typeof body?.price === "number") data.price = Math.max(0, Number(body.price));

    const created = await prisma.service.create({
      data,
      select: {
        id: true, name: true, description: true, durationMin: true, color: true, active: true,
        // priceCents: true, price: true,
      },
    });

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (err: any) {
    console.error("[calendar.services] POST error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Create failed" }, { status: 500 });
  }
}

// ===== PATCH (actualizar parcial) =====
export async function PATCH(req: Request) {
  try {
    const userId = await getUserIdFromSession();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    // comprobar acceso a la location del servicio
    const found = await prisma.service.findUnique({ where: { id }, select: { id: true, locationId: true } });
    if (!found) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const { allowed } = await assertLocationAccess(userId, found.locationId);
    if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const data: any = {};
    if (typeof body?.name === "string") {
      const nm = body.name.trim();
      if (!nm) return NextResponse.json({ ok: false, error: "invalid name" }, { status: 400 });
      data.name = nm;
    }
    if (typeof body?.description === "string") data.description = body.description;
    if (Number.isFinite(Number(body?.durationMin))) data.durationMin = Number(body.durationMin);
    if (body?.color === null) data.color = null;
    else if (typeof body?.color === "string" && body.color.trim()) data.color = String(body.color);

    if (typeof body?.active === "boolean") data.active = !!body.active;

    // Precio: una de las dos
    if (typeof body?.priceCents === "number") data.priceCents = Math.max(0, Math.round(body.priceCents));
    if (typeof body?.price === "number") data.price = Math.max(0, Number(body.price));

    const updated = await prisma.service.update({
      where: { id },
      data,
      select: {
        id: true, name: true, description: true, durationMin: true, color: true, active: true,
        // priceCents: true, price: true,
      },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    console.error("[calendar.services] PATCH error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}
