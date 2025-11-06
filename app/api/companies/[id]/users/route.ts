// app/api/companies/[id]/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import type { CompanyRole, LocationRole, Role } from "@prisma/client";

/* =========================
   Tipos DTO
   ========================= */
type BasicLocation = {
  id: string;
  title: string;
  city: string | null;
  region: string | null;
  countryCode: string | null;
};

type UserLocationDTO = {
  role: LocationRole;
  location: BasicLocation;
};

type CompanyUserDTO = {
  companyRole: CompanyRole;
  linkedAt: Date;

  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  userRole: Role;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  locale: string | null;
  timezone: string | null;

  locations?: UserLocationDTO[];
};

export const dynamic = "force-dynamic";

/* =========================
   GET /companies/:id/users
   =========================
   Query:
   - includeLocations=true
   - onlyActive=true
*/
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id: companyId } = params;
  const url = new URL(req.url);
  const includeLocations = url.searchParams.get("includeLocations") === "true";
  const onlyActive = url.searchParams.get("onlyActive") === "true";

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    const includeUserBase = {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      locale: true,
      timezone: true,
    } as const;

    const rows = await prisma.userCompany.findMany({
      where: { companyId },
      include: {
        User: includeLocations
          ? {
              select: {
                ...includeUserBase,
                UserLocation: {
                  select: {
                    role: true,
                    location: {
                      select: { id: true, title: true, city: true, region: true, countryCode: true },
                    },
                  },
                },
              },
            }
          : { select: includeUserBase },
      },
      orderBy: { createdAt: "asc" },
    });

    const items: CompanyUserDTO[] = rows
      .filter((uc) => uc.User !== null)
      .map((uc) => {
        const u = uc.User!;
        const dto: CompanyUserDTO = {
          companyRole: uc.role,
          linkedAt: uc.createdAt,
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          userRole: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          locale: u.locale,
          timezone: u.timezone,
        };
        if (includeLocations) {
          dto.locations = (u as any).UserLocation.map((ul: any) => ({
            role: ul.role,
            location: ul.location as BasicLocation,
          }));
        }
        return dto;
      })
      .filter((u) => (onlyActive ? u.isActive : true));

    return NextResponse.json({ ok: true, company, count: items.length, data: items });
  } catch (err: any) {
    console.error("[GET /companies/[id]/users] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

/* =========================
   POST /companies/:id/users
   Crea o reasocia (upsert) un usuario a la company.
   Body: { userId: string, role?: CompanyRole }
   ========================= */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id: companyId } = params;
  let body: { userId?: string; role?: CompanyRole };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, role } = body ?? {};
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
  }

  try {
    // existencias mínimas
    const [company, user] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    ]);
    if (!company) return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    // upsert sobre la unique compuesta @@unique([userId, companyId])
    const uc = await prisma.userCompany.upsert({
      where: { userId_companyId: { userId, companyId } },
      create: { userId, companyId, role: role ?? "MEMBER" },
      update: { role: role ?? "MEMBER" },
      include: { User: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ ok: true, data: uc });
  } catch (err: any) {
    console.error("[POST /companies/[id]/users] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

/* =========================
   PATCH /companies/:id/users
   Cambia el role de un usuario ya vinculado.
   Body: { userId: string, role: CompanyRole }
   ========================= */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id: companyId } = params;
  let body: { userId?: string; role?: CompanyRole };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, role } = body ?? {};
  if (!userId || !role) {
    return NextResponse.json({ ok: false, error: "Missing userId or role" }, { status: 400 });
  }

  try {
    const updated = await prisma.userCompany.update({
      where: { userId_companyId: { userId, companyId } },
      data: { role },
    });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    console.error("[PATCH /companies/[id]/users] Error:", err);
    // Si no existe la relación, Prisma lanza error
    return NextResponse.json({ ok: false, error: err?.message ?? "Not found" }, { status: 404 });
  }
}

/* =========================
   DELETE /companies/:id/users
   Desasocia un usuario.
   - Body JSON: { userId: string }
   - o query:   ?userId=...
   ========================= */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id: companyId } = params;
  const url = new URL(req.url);
  const userIdFromQuery = url.searchParams.get("userId");

  let userId = userIdFromQuery as string | null;
  if (!userId) {
    try {
      const body = await req.json();
      userId = body?.userId ?? null;
    } catch {
      // ignorar si no hay body
    }
  }
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
  }

  try {
    const deleted = await prisma.userCompany.delete({
      where: { userId_companyId: { userId, companyId } },
    });
    return NextResponse.json({ ok: true, data: deleted });
  } catch (err: any) {
    console.error("[DELETE /companies/[id]/users] Error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Not found" }, { status: 404 });
  }
}
