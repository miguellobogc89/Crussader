import { NextResponse } from "next/server";
import { PrismaClient, LocationStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

// GET /api/calendar/services?locationId=...
// Devuelve los servicios activos de una location SI el usuario tiene acceso a esa location
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId") || "";
    if (!locationId) {
      return NextResponse.json({ ok: false, error: "locationId is required" }, { status: 400 });
    }

    // Resolve userId from email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que la location existe y está ACTIVA
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, companyId: true, status: true },
    });
    if (!loc || loc.status !== LocationStatus.ACTIVE) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // Comprobar acceso del usuario a la location:
    //  A) asignación directa en UserLocation
    //  B) pertenencia a la compañía (UserCompany)
    const [directAccess, companyAccess] = await Promise.all([
      prisma.userLocation.findFirst({ where: { userId: user.id, locationId } }),
      prisma.userCompany.findFirst({ where: { userId: user.id, companyId: loc.companyId } }),
    ]);

    if (!directAccess && !companyAccess) {
      // No acceso
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Servicios activos de esa location
    const services = await prisma.service.findMany({
      where: { locationId, active: true },
      select: {
        id: true,
        name: true,
        durationMin: true,
        color: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ ok: true, items: services });
  } catch (err: any) {
    console.error("[calendar.services] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
