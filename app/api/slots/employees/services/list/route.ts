// app/api/slots/employees/services/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EmployeeServiceRow = {
  employeeId: string;
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId")?.trim() ?? "";
    const locationId = searchParams.get("locationId")?.trim() ?? "";

    if (!employeeId && !locationId) {
      return NextResponse.json(
        { ok: false, error: "employeeId or locationId is required." },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRaw<EmployeeServiceRow[]>`
      SELECT
        es.employee_id AS "employeeId",
        s.id,
        s.name,
        s.duration_min AS "durationMin",
        s.price::float8 AS price,
        s.active
      FROM employee_service es
      INNER JOIN slot_recovery_service s
        ON s.id = es.service_id
      INNER JOIN "EmployeeLocation" el
        ON el."employeeId" = es.employee_id
      WHERE
        (${employeeId} = '' OR es.employee_id = ${employeeId})
        AND (${locationId} = '' OR el."locationId" = ${locationId})
      ORDER BY es.created_at ASC
    `;

    return NextResponse.json({
      ok: true,
      services: rows.map((row) => {
        return {
          employeeId: row.employeeId,
          id: row.id,
          name: row.name,
          durationMin: Number(row.durationMin ?? 0),
          price: Number(row.price ?? 0),
          active: Boolean(row.active),
        };
      }),
    });
  } catch (error) {
    console.error("[GET /api/slots/employees/services/list]", error);

    return NextResponse.json(
      { ok: false, error: "No se pudieron cargar los servicios del empleado." },
      { status: 500 }
    );
  }
}