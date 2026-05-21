// app/api/slots/employees/services/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = String(body.employeeId || "").trim();
    const serviceId = String(body.serviceId || "").trim();
    const action = String(body.action || "").trim(); // "assign" | "unassign"

    if (!employeeId || !serviceId || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing params." },
        { status: 400 },
      );
    }

    if (action === "assign") {
      await prisma.employee_service.upsert({
        where: {
          employee_id_service_id: {
            employee_id: employeeId,
            service_id: serviceId,
          },
        },
        update: {},
        create: {
          employee_id: employeeId,
          service_id: serviceId,
        },
      });
    }

    if (action === "unassign") {
      await prisma.employee_service.deleteMany({
        where: {
          employee_id: employeeId,
          service_id: serviceId,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /employees/services/update]", error);

    return NextResponse.json(
      { ok: false, error: "Update failed." },
      { status: 500 },
    );
  }
}