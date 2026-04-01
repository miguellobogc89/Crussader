// app/api/slots/employees/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId")?.trim();

    if (!locationId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing locationId",
        },
        { status: 400 },
      );
    }

    const rows = await prisma.employeeLocation.findMany({
      where: {
        locationId,
        visibleInLocation: true,
        employee: {
          active: true,
        },
      },
      select: {
        isPrimary: true,
        employee: {
          select: {
            id: true,
            name: true,
            color: true,
            job_title: true,
            active: true,
          },
        },
      },
    });

    const employees = rows
      .map((row) => {
        return {
          id: row.employee.id,
          name: row.employee.name,
          role: row.employee.job_title || "Sin especialidad",
          color: row.employee.color || "",
          isPrimary: row.isPrimary,
        };
      })
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "es");
      });

    return NextResponse.json({
      ok: true,
      employees,
    });
  } catch (error) {
    console.error("[slots/employees/list] GET", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron cargar los empleados.",
      },
      { status: 500 },
    );
  }
}