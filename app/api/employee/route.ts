// app/api/employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = normalizeText(searchParams.get("locationId") ?? "");
    const serviceId = normalizeText(searchParams.get("serviceId") ?? "");
    const query = normalizeText(searchParams.get("q") ?? "");
    const limitParam = Number(searchParams.get("limit") ?? "100");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    let limit = 100;

    if (Number.isNaN(limitParam) === false) {
      limit = limitParam;
    }

    if (limit < 1) {
      limit = 1;
    }

    if (limit > 200) {
      limit = 200;
    }

    const rows = await prisma.employeeLocation.findMany({
      where: {
        locationId,
        visibleInLocation: true,
        employee: {
          active: true,
          employee_service: serviceId
            ? {
                some: {
                  service_id: serviceId,
                },
              }
            : undefined,
          OR: query
            ? [
                {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  job_title: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: query,
                  },
                },
              ]
            : undefined,
        },
      },
      select: {
        id: true,
        isPrimary: true,
        allowCrossLocationBooking: true,
        employee: {
          select: {
            id: true,
            name: true,
            color: true,
            job_title: true,
            title: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
      },
      take: limit,
    });

    const items = rows
      .map((row) => {
        return {
          id: row.employee.id,
          employeeLocationId: row.id,
          locationId,
          name: row.employee.name,
          role: row.employee.job_title || "Sin especialidad",
          color: row.employee.color || "",
          title: row.employee.title,
          firstName: row.employee.first_name,
          lastName: row.employee.last_name,
          email: row.employee.email,
          phone: row.employee.phone,
          isPrimary: row.isPrimary,
          allowCrossLocationBooking: row.allowCrossLocationBooking,
        };
      })
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) {
          return a.isPrimary ? -1 : 1;
        }

        return a.name.localeCompare(b.name, "es", {
          sensitivity: "base",
        });
      });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/employee error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}