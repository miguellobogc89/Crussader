import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, CompanyRole, LocationType } from "@prisma/client";
import { errorMessage } from "@/lib/error-message";

const prisma = new PrismaClient();

async function ensureMember(email: string | null, companyId: string) {
  if (!email) return { ok: false as const, status: 401, error: "unauth" };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { ok: false as const, status: 401, error: "no_user" };

  // Permite OWNER / ADMIN / MEMBER
  const membership = await prisma.userCompany.findFirst({
    where: {
      userId: user.id,
      companyId,
      role: { in: [CompanyRole.OWNER, CompanyRole.ADMIN, CompanyRole.MEMBER] },
    },
    select: { id: true },
  });
  if (!membership) return { ok: false as const, status: 403, error: "forbidden" };

  return { ok: true as const, userId: user.id };
}

// GET /api/companies/:id/locations  → lista ubicaciones de la empresa
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // Next 15: params es Promise
    const session = await getServerSession(authOptions);
    const guard = await ensureMember(session?.user?.email ?? null, id);
    if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

    const locations = await prisma.location.findMany({
      where: { companyId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        region: true,
        country: true,
        postalCode: true,
        phone: true,
        website: true,
        googlePlaceId: true,
        googleName: true,
        reviewsCount: true,
        reviewsAvg: true, // Prisma.Decimal | number | null
        createdAt: true,
        updatedAt: true,
      },
    });

    const rows = locations.map((l) => ({
      ...l,
      reviewsCount: l.reviewsCount ?? 0,
      reviewsAvg: l.reviewsAvg != null ? Number(l.reviewsAvg as unknown as number) : null,
    }));

    return NextResponse.json({ ok: true, locations: rows });
  } catch (e: unknown) {
    console.error("[GET /companies/:id/locations] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}

// POST /api/companies/:id/locations  → crea una ubicación básica
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await context.params;

    const session = await getServerSession(authOptions);
    const guard = await ensureMember(session?.user?.email ?? null, companyId);
    if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

    type CreateLocationBody = {
      title?: string;
      address?: string | null;
      city?: string | null;
      region?: string | null;
      country?: string | null;
      postalCode?: string | null;
      phone?: string | null;
      website?: string | null;
      googlePlaceId?: string | null;
      googleName?: string | null;
      reviewsCount?: number;
      reviewsAvg?: number;
      type?: string | null;   // llega como string; se mapea al enum
      // status?: string;     // si tienes enum para status, lo mapeamos después
    };

    const body = (await req.json().catch(() => ({}))) as Partial<CreateLocationBody>;

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "missing_title" }, { status: 400 });
    }

    // mapear string -> enum LocationType (o null si no coincide)
    const typeValue: LocationType | null =
      body.type && Object.values(LocationType).includes(body.type as LocationType)
        ? (body.type as LocationType)
        : null;

    const data = {
      companyId,
      title,
      address: body.address ?? null,
      city: body.city ?? null,
      region: body.region ?? null,
      country: body.country ?? null,
      postalCode: body.postalCode ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      googlePlaceId: body.googlePlaceId ?? null,
      googleName: body.googleName ?? null,
      reviewsCount: typeof body.reviewsCount === "number" ? body.reviewsCount : undefined,
      reviewsAvg: typeof body.reviewsAvg === "number" ? body.reviewsAvg : undefined,
      type: typeValue,
      // status: ... (si es enum en tu schema, añadir mapeo similar al de type)
    };

    const loc = await prisma.location.create({
      data,
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        region: true,
        country: true,
        postalCode: true,
        phone: true,
        website: true,
        googlePlaceId: true,
        googleName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, location: loc });
  } catch (e: unknown) {
    console.error("[POST /companies/:id/locations] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }
}
