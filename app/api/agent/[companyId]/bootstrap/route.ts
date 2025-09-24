import { NextResponse } from "next/server";
import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;
    const auth = req.headers.get("authorization");
    const apiKey = process.env.CALENDAR_API_KEY; // de momento global, luego por empresa

    if (auth !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Info de la compañía con locations (cada location ya trae services y resources)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        Location: {
          select: {
            id: true,
            title: true,
            services: { select: { id: true, name: true, durationMin: true } },
            resources: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { ok: false, error: "Company not found" },
        { status: 404 }
      );
    }

    // empleados: todos los que estén vinculados a las locations de la company
    const employees = await prisma.employee.findMany({
      where: {
        locations: {
          some: {
            location: { companyId },
          },
        },
      },
      select: { id: true, name: true, active: true },
    });

    // citas de hoy (todas las locations de esta company)
    const today = new Date();
    const startDay = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0)
    );
    const endDay = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999)
    );

    const appointments = await prisma.appointment.findMany({
      where: {
        location: { companyId },
        startAt: { gte: startDay, lte: endDay },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.BOOKED,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        customerName: true,
        notes: true,
        service: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
        location: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        locations: company.Location,
        employees,
      },
      appointments,
    });
  } catch (err: any) {
    console.error("[agent.bootstrap] error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
