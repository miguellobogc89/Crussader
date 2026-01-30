// app/api/calendar/employees/roles/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    if (!locationId || !String(locationId).trim()) {
      return NextResponse.json(
        { ok: false, error: "locationId requerido" },
        { status: 400 }
      );
    }

    // 1) Derivar companyId desde la location
    const loc = await prisma.location.findUnique({
      where: { id: String(locationId) },
      select: { companyId: true },
    });

    if (!loc?.companyId) {
      return NextResponse.json(
        { ok: false, error: "locationId inválido" },
        { status: 400 }
      );
    }

    const companyId = String(loc.companyId);

    // 2) Roles usados por empleados de esa company (vía EmployeeRole -> Employee -> EmployeeLocation -> Location.companyId)
    const roles = await prisma.staffRole.findMany({
      where: {
        active: true,
        employees: {
          some: {
            employee: {
              locations: {
                some: {
                  location: {
                    companyId,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, items: roles });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error cargando roles" },
      { status: 500 }
    );
  }
}
