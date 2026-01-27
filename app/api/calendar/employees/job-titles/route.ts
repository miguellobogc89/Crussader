// app/api/calendar/employees/job-titles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/employees/job-titles?locationId=...
 * Devuelve los cargos (job_title) existentes en la COMPANY de esa location.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    // 1) Resolver companyId desde la location
    const loc = await prisma.location.findUnique({
      where: { id: String(locationId) },
      select: { companyId: true },
    });

    if (!loc?.companyId) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    // 2) DISTINCT job_title dentro de esa company (vía EmployeeLocation -> Location)
    const rows = await prisma.employee.findMany({
      where: {
        locations: {
          some: {
            location: { companyId: loc.companyId },
          },
        },
        job_title: { not: null },
      },
      select: { job_title: true },
      distinct: ["job_title"],
      orderBy: { job_title: "asc" },
    });

    return NextResponse.json({
      items: rows.map((r) => r.job_title).filter(Boolean),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
