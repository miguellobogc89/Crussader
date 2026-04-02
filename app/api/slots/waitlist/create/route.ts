// app/api/slots/waitlist/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeText(value: string): string {
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const locationId = normalizeText(body?.locationId ?? "");
    const customerId = normalizeText(body?.customerId ?? "");
    const customerName = normalizeText(body?.customerName ?? "");
    const customerPhone = normalizeText(body?.customerPhone ?? "");
    const slotRecoveryServiceId = normalizeText(body?.slotRecoveryServiceId ?? "");
    const serviceName = normalizeText(body?.serviceName ?? "");
    const note = normalizeText(body?.note ?? "");
    const isUrgent = Boolean(body?.isUrgent ?? false);

    const timePreference = Array.isArray(body?.timePreference)
      ? body.timePreference
          .map((value: unknown) => normalizeText(String(value ?? "")))
          .filter((value: string) => value.length > 0)
      : [];

    const dayPreference = Array.isArray(body?.dayPreference)
      ? body.dayPreference
          .map((value: unknown) => normalizeText(String(value ?? "")))
          .filter((value: string) => value.length > 0)
      : [];

    // 🔴 NUEVO: empleados para urgencias
    const employeeIdsRaw = Array.isArray(body?.employeeIds)
      ? body.employeeIds
      : Array.isArray(body?.selectedEmployeeIds)
        ? body.selectedEmployeeIds
        : [];

    const employeeIds = employeeIdsRaw
      .map((value: unknown) => normalizeText(String(value ?? "")))
      .filter((value: string) => value.length > 0);

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId is required" },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { ok: false, error: "customerName is required" },
        { status: 400 }
      );
    }

    // 🔑 Obtener companyId desde location
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const created = await prisma.slot_waitlist_entry.create({
      data: {
        company_id: companyId,
        location_id: locationId,
        customer_id: customerId || null,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        slot_recovery_service_id: slotRecoveryServiceId || null,
        service_name: serviceName || null,
        note: note || null,
        is_urgent: isUrgent,
        time_preference: timePreference,
        day_preference: dayPreference,
        status: "active",
        expires_at: expiresAt,

        // 🔴 NUEVO: guardar empleados
        slot_waitlist_entry_employee: {
          create: employeeIds.map((employeeId: string) => ({
            employee_id: employeeId,
          })),
        },
      },
select: {
  id: true,
  customer_name: true,
  customer_phone: true,
  service_name: true,
  note: true,
  is_urgent: true,
  created_at: true,
  time_preference: true,
  day_preference: true,
  slot_waitlist_entry_employee: {
    select: {
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
  item: {
    id: created.id,
    customerName: created.customer_name,
    customerPhone: created.customer_phone,
    serviceName: created.service_name,
    note: created.note,
    isUrgent: created.is_urgent,
    createdAt: created.created_at.toISOString(),
    timePreference: created.time_preference,
    dayPreference: created.day_preference,
    employees: created.slot_waitlist_entry_employee.map((row) => ({
      id: row.Employee.id,
      name: row.Employee.name,
    })),
  },
});

  } catch (error) {
    console.error("POST /api/slots/waitlist/create error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}