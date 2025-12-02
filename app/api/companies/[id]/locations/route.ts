// app/api/companies/[id]/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CompanyRole, LocationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function ensureMember(email: string | null, companyId: string) {
  if (!email) return { ok: false as const, status: 401, error: "unauth" };
  const me = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!me) return { ok: false as const, status: 401, error: "no_user" };
  const member = await prisma.userCompany.findFirst({
    where: { userId: me.id, companyId },
    select: { role: true },
  });
  if (!member) return { ok: false as const, status: 403, error: "forbidden" };
  return { ok: true as const, userId: me.id, role: member.role };
}

function canEdit(role: CompanyRole) {
  return role === CompanyRole.OWNER || role === CompanyRole.ADMIN;
}

/** GET - devuelve ubicaciones de la compañía (ya lo tenías similar) */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await ctx.params;

  const locations = await prisma.location.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyId: true,
      title: true,
      address: true,
      city: true,
      region: true,
      country: true,
      postalCode: true,
      featuredImageUrl: true,
      phone: true,
      type: true,
      website: true,
      googleName: true,
      googlePlaceId: true,
      googleAccountId: true,
      googleLocationId: true,
      lastSyncAt: true,
      reviewsAvg: true,
      reviewsCount: true,
      ExternalConnection: {
        select: { id: true, provider: true, accountEmail: true },
      },
    },
  });

  return NextResponse.json({ ok: true, locations });
}

/** POST - crea 1..N ubicaciones */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const guard = await ensureMember(session?.user?.email ?? null, companyId);
  if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  if (!canEdit(guard.role)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));

  type NewLoc = {
    title: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    region?: string | null;
    country?: string | null;
  };

  const asArray: NewLoc[] = Array.isArray(body?.locations)
    ? body.locations
    : body && body.title
      ? [body as NewLoc]
      : [];

  if (asArray.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_payload" }, { status: 400 });
  }

  // sanea entradas
  const inputs = asArray
    .map((l) => ({
      title: String(l.title ?? "").trim(),
      address: l.address ? String(l.address).trim() : null,
      city: l.city ? String(l.city).trim() : null,
      postalCode: l.postalCode ? String(l.postalCode).trim() : null,
      phone: l.phone ? String(l.phone).trim() : null,
      website: l.website ? String(l.website).trim() : null,
      region: l.region ? String(l.region).trim() : null,
      country: l.country ? String(l.country).trim() : null,
    }))
    .filter((x) => x.title.length > 0);

  if (inputs.length === 0) {
    return NextResponse.json({ ok: false, error: "missing_title" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const out = [];
    for (const l of inputs) {
      const row = await tx.location.create({
        data: {
          companyId,
          title: l.title,
          address: l.address,
          city: l.city,
          postalCode: l.postalCode,
          phone: l.phone,
          website: l.website,
          region: l.region,
          country: l.country,
          status: LocationStatus.DRAFT,
        },
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          postalCode: true,
          phone: true,
          website: true,
          lastSyncAt: true,
          reviewsAvg: true,
          reviewsCount: true,
          googlePlaceId: true,
          ExternalConnection: {
            select: { id: true, provider: true, accountEmail: true },
          },
        },
      });
      out.push(row);
    }
    return out;
  });

  return NextResponse.json({ ok: true, created, count: created.length }, { status: 201 });
}


/** PATCH - actualiza campos de una ubicación concreta (ej: featuredImageUrl) */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await ctx.params;

  const session = await getServerSession(authOptions);
  const guard = await ensureMember(session?.user?.email ?? null, companyId);
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status },
    );
  }
  if (!canEdit(guard.role)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({} as any));
  const locationId = String(body.locationId ?? "").trim();
  const featuredImageUrlRaw = body.featuredImageUrl;

  if (!locationId || typeof featuredImageUrlRaw !== "string") {
    return NextResponse.json(
      { ok: false, error: "missing_location_or_image" },
      { status: 400 },
    );
  }

  // opcional: si quieres tratar "" como "quitar imagen"
  const featuredImageUrl =
    featuredImageUrlRaw.trim().length > 0 ? featuredImageUrlRaw.trim() : null;

  const existing = await prisma.location.findFirst({
    where: { id: locationId, companyId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "location_not_found" },
      { status: 404 },
    );
  }

  const updated = await prisma.location.update({
    where: { id: locationId },
    data: { featuredImageUrl },
    select: { id: true, featuredImageUrl: true },
  });

  return NextResponse.json({ ok: true, location: updated });
}
