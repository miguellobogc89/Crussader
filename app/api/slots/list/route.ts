// app/api/slots/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

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
    const companyId = searchParams.get("companyId");
    const locationId = searchParams.get("locationId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId,
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

    const whereClause: {
      company_id: string;
      location_id?: string;
    } = {
      company_id: companyId,
    };

    if (locationId) {
      whereClause.location_id = locationId;
    }

    await prisma.slot_recovery_slot.updateMany({
      where: {
        company_id: companyId,
        ...(locationId ? { location_id: locationId } : {}),
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
      where: whereClause,
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
        recovered_service_id: true,
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
        slot_recovery_service: {
          select: {
            id: true,
            name: true,
            price: true,
            duration_min: true,
          },
        },
        Appointment_slot_recovery_slot_recovered_appointment_idToAppointment: {
          select: {
            id: true,
            serviceName: true,
            servicePrice: true,
            serviceDurationMin: true,
            slotRecoveryServiceId: true,
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
        const recoveredService = slot.slot_recovery_service;

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
            slot.recovered_service_id ??
            recoveredAppointment?.slotRecoveryServiceId ??
            null,
          recoveredServiceName:
            recoveredAppointment?.serviceName ?? recoveredService?.name ?? null,
          recoveredSoldAmount:
            recoveredAppointment?.servicePrice != null
              ? Number(recoveredAppointment.servicePrice)
              : recoveredService?.price != null
              ? Number(recoveredService.price)
              : null,
          recoveredServiceDurationMin:
            recoveredAppointment?.serviceDurationMin ??
            recoveredService?.duration_min ??
            null,
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