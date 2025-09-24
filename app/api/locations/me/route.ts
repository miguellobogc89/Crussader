// app/api/locations/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, LocationStatus } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Usamos el email (tiene índice único) para resolver el userId
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // A) Ubicaciones asignadas explícitamente al usuario (UserLocation)
    const userLocations = await prisma.userLocation.findMany({
      where: { userId },
      select: { locationId: true, location: { select: { status: true } } },
    });
    const directLocationIds = userLocations
      .filter((ul) => ul.location?.status === LocationStatus.ACTIVE)
      .map((ul) => ul.locationId);

    // B) Compañías donde el usuario es miembro (UserCompany)
    const memberships = await prisma.userCompany.findMany({
      where: { userId },
      select: { companyId: true },
    });
    const companyIds = memberships.map((m) => m.companyId);

    // C) Ubicaciones activas de esas compañías
    const companyLocations = companyIds.length
      ? await prisma.location.findMany({
          where: { companyId: { in: companyIds }, status: LocationStatus.ACTIVE },
          select: { id: true },
        })
      : [];

    const companyLocationIds = companyLocations.map((l) => l.id);

    // D) Unión + deduplicado
    const allIds = Array.from(new Set([...directLocationIds, ...companyLocationIds]));
    if (allIds.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // E) Datos mínimos para el front
    const items = await prisma.location.findMany({
      where: { id: { in: allIds }, status: LocationStatus.ACTIVE },
      select: { id: true, title: true, city: true, timezone: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("[locations.me] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
