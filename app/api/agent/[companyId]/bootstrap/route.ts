// /app/api/agent/[companyId]/bootstrap/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, AppointmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;

    // === Auth por API key (con check de config) ===
    const apiKey = process.env.CALENDAR_API_KEY; // de momento global, luego por empresa
    if (!apiKey) {
      console.error("[bootstrap] CALENDAR_API_KEY no configurada en el servidor");
      return NextResponse.json(
        { ok: false, error: "Server misconfigured: missing CALENDAR_API_KEY" },
        { status: 500 }
      );
    }

    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${apiKey}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // === Company + locations con horarios/recursos ===
    // (No seleccionamos agentSettings porque no existe en tu schema actual)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        // En tu schema la relación se llama "Location" (tal como usabas antes)
        Location: {
          select: {
            id: true,
            title: true,
            timezone: true,      // tz IANA
            openingHours: true,  // jsonb (semana con windows)
            exceptions: true,    // jsonb (fechas concretas)
            services: { select: { id: true, name: true, durationMin: true } },
            resources: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ ok: false, error: "Company not found" }, { status: 404 });
    }

    // === Empleados vinculados a las locations de la company (sin horarios por ahora) ===
    const employees = await prisma.employee.findMany({
      where: {
        locations: {
          some: { location: { companyId } },
        },
      },
      select: { id: true, name: true, active: true },
    });

    // === Citas de HOY (límites en día UTC) ===
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

    // === Respuesta ===
    return NextResponse.json({
      ok: true,
      company: {
        id: company.id,
        name: company.name,
        locations: company.Location, // incluye timezone/openingHours/exceptions
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
