// app/api/service/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = normalizeText(searchParams.get("companyId") ?? "");
    const employeeId = normalizeText(searchParams.get("employeeId") ?? "");
    const query = normalizeText(searchParams.get("q") ?? "");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId is required" },
        { status: 400 }
      );
    }

    const services = await prisma.slot_recovery_service.findMany({
      where: {
        company_id: companyId,
        active: true,
        name: query
          ? {
              contains: query,
              mode: "insensitive",
            }
          : undefined,
        employee_service: employeeId
          ? {
              some: {
                employee_id: employeeId,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        duration_min: true,
        price: true,
        price_cents: true,
        position: true,
      },
      orderBy: [
        {
          position: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    const items = services.map((service) => {
      return {
        id: service.id,
        name: service.name,
        durationMin: service.duration_min,
        price: service.price.toString(),
        priceCents: service.price_cents,
        position: service.position,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("GET /api/service error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}