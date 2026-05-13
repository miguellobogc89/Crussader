// app/api/slots/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId")?.trim() ?? "";

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId_required" },
        { status: 400 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "invalid_location" },
        { status: 400 }
      );
    }

    if (!isAdmin) {
      const membership = await prisma.userLocation.findFirst({
        where: {
          userId: user.id,
          locationId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const companyId = location.companyId;

    await prisma.slot_recovery_slot.updateMany({
      where: {
        company_id: companyId,
        location_id: locationId,
        starts_at: {
          lte: new Date(),
        },
        recovered_at: null,
        status: {
          in: ["pending_publish", "sent"],
        },
      },
      data: {
        status: "expired",
        updated_at: new Date(),
      },
    });

    const slots = await prisma.slot_recovery_slot.findMany({
      where: {
        company_id: companyId,
        location_id: locationId,
      },
      select: {
        id: true,
        company_id: true,
        location_id: true,
        employee_id: true,
        starts_at: true,
        ends_at: true,
        expires_at: true,
        status: true,
        manual_publish_required: true,
        published_at: true,
        recovered_at: true,
        service_name: true,
        notes: true,
        target_customer_count: true,
        sent_customer_count: true,
        replied_customer_count: true,
        booked_customer_count: true,
        created_at: true,
        Employee: {
          select: {
            id: true,
            name: true,
          },
        },
        Appointment_slot_recovery_slot_recovered_appointment_idToAppointment: {
          select: {
            id: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,
            slotRecoveryServiceId: true,
            customerName: true,
            customerPhone: true,
            customerEmail: true,
          },
        },
        slot_recovery_slot_service: {
          select: {
            id: true,
            position: true,
            slot_recovery_service: {
              select: {
                id: true,
                name: true,
                price: true,
                duration_min: true,
                active: true,
              },
            },
          },
          orderBy: [{ position: "asc" }, { created_at: "asc" }],
        },
      },
      orderBy: {
        starts_at: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      slots: slots.map((slot) => {
        const services = slot.slot_recovery_slot_service.map((rel) => {
          const svc = rel.slot_recovery_service;

          return {
            id: svc.id,
            name: svc.name,
            price: Number(svc.price),
            durationMin: svc.duration_min,
            position: rel.position,
          };
        });

        const recoveredAppointment =
          slot.Appointment_slot_recovery_slot_recovered_appointment_idToAppointment;

        return {
          id: slot.id,
          companyId: slot.company_id,
          locationId: slot.location_id,
          employeeId: slot.employee_id,
          employeeName: slot.Employee?.name ?? null,
          startsAt: slot.starts_at,
          endsAt: slot.ends_at,
          expiresAt: slot.expires_at,
          status: slot.status,
          manualPublishRequired: slot.manual_publish_required,
          publishedAt: slot.published_at,
          recoveredAt: slot.recovered_at,
          serviceName: slot.service_name,
          notes: slot.notes,
          targetCustomerCount: slot.target_customer_count,
          sentCustomerCount: slot.sent_customer_count,
          repliedCustomerCount: slot.replied_customer_count,
          bookedCustomerCount: slot.booked_customer_count,
          createdAt: slot.created_at,
recoveredServiceId:
  recoveredAppointment?.slotRecoveryServiceId ?? null,

recoveredServiceName:
  recoveredAppointment?.serviceName ?? null,

recoveredSoldAmount:
  recoveredAppointment?.servicePrice != null
    ? Number(recoveredAppointment.servicePrice)
    : null,

recoveredServiceDurationMin:
  recoveredAppointment?.serviceDurationMin ?? null,

recoveredCustomerName:
  recoveredAppointment?.customerName ?? null,

recoveredCustomerPhone:
  recoveredAppointment?.customerPhone ?? null,

recoveredCustomerEmail:
  recoveredAppointment?.customerEmail ?? null,
  
          servicesCount: services.length,
          services,
        };
      }),
    });
  } catch (e) {
    console.error("[GET /api/slots/list]", e);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}