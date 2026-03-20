// app/api/services/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type Body = {
  locationId?: string;
  name?: string;
  price?: number;
  durationMin?: number;
};

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

function normalizePrice(value: unknown): number | null {
  if (typeof value !== "number") {
    return null;
  }

  if (Number.isNaN(value)) {
    return null;
  }

  if (value < 0) {
    return null;
  }

  return value;
}

function normalizeDuration(value: unknown): number | null {
  if (typeof value !== "number") {
    return null;
  }

  if (Number.isNaN(value)) {
    return null;
  }

  if (value <= 0) {
    return null;
  }

  return Math.floor(value);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Body;

    const locationId = normalizeString(body.locationId);
    const name = normalizeString(body.name);
    const price = normalizePrice(body.price);
    const durationMin = normalizeDuration(body.durationMin);

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId_required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "name_required" },
        { status: 400 }
      );
    }

    if (price === null) {
      return NextResponse.json(
        { ok: false, error: "price_invalid" },
        { status: 400 }
      );
    }

    if (durationMin === null) {
      return NextResponse.json(
        { ok: false, error: "duration_invalid" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "location_not_found" },
        { status: 404 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: location.companyId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const existing = await prisma.service.findFirst({
      where: {
        locationId: location.id,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "service_already_exists" },
        { status: 409 }
      );
    }

    const created = await prisma.service.create({
      data: {
        locationId: location.id,
        name,
        price,
        priceCents: Math.round(price * 100),
        durationMin,
        active: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        durationMin: true,
        active: true,
      },
    });

    return NextResponse.json({
      ok: true,
      service: {
        id: created.id,
        name: created.name,
        price: Number(created.price),
        durationMin: created.durationMin,
        active: created.active,
      },
    });
  } catch (error) {
    console.error("[POST /api/services/create]", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}