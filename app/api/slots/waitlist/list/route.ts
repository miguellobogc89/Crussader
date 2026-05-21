// app/api/slots/waitlist/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const locationId = normalizeText(searchParams.get("locationId") ?? "");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { companyId: true },
    });

    if (!location?.companyId) {
      return NextResponse.json(
        { ok: false, error: "Invalid locationId" },
        { status: 400 }
      );
    }

    const companyId = location.companyId;
    const now = new Date();

const items = await prisma.slot_waitlist_entry.findMany({
  where: {
    company_id: companyId,
    location_id: locationId,
    status: "active",
    OR: [
      {
        expires_at: null,
      },
      {
        expires_at: {
          gt: now,
        },
      },
    ],
  },
  orderBy: [
    {
      is_urgent: "desc",
    },
    {
      created_at: "desc",
    },
  ],
  select: {
    id: true,
    customer_name: true,
    customer_phone: true,
    service_name: true,
    note: true,
    is_urgent: true,
    created_at: true,
    slot_waitlist_entry_employee: {
      select: {
        employee_id: true,
        Employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  },
});

return NextResponse.json({
  ok: true,
  items: items.map((item) => {
    return {
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      serviceName: item.service_name,
      note: item.note,
      isUrgent: item.is_urgent,
      createdAt: item.created_at.toISOString(),
      employees: item.slot_waitlist_entry_employee.map((row) => {
        return {
          id: row.Employee.id,
          name: row.Employee.name,
        };
      }),
    };
  }),
});


  } catch (error) {
    console.error("GET /api/slots/waitlist/list error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}