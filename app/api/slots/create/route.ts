// app/api/slots/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type CreateSlotBody = {
  locationId?: string;
  selectedLocationId?: string;
  employeeId?: string;
  startsAt?: string;
  endsAt?: string;
  serviceName?: string | null;
  notes?: string;
  selectedServiceIds?: string[];
  sourceAppointmentId?: string | null;
};

export async function POST(req: NextRequest) {
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

    const body = (await req.json()) as CreateSlotBody;

    const rawLocationId = body.locationId ?? body.selectedLocationId ?? "";
    const locationId = rawLocationId.trim();
    const employeeId = (body.employeeId ?? "").trim();
    const startsAtRaw = body.startsAt?.trim() ?? "";
    const endsAtRaw = body.endsAt?.trim() ?? "";
    const serviceNameRaw = body.serviceName?.trim() ?? "";
    const notesRaw = body.notes?.trim() ?? "";
    const sourceAppointmentId =
      typeof body.sourceAppointmentId === "string"
        ? body.sourceAppointmentId.trim()
        : "";

    const selectedServiceIds = Array.isArray(body.selectedServiceIds)
      ? body.selectedServiceIds
          .map((value) => String(value).trim())
          .filter((value, index, array) => {
            return value.length > 0 && array.indexOf(value) === index;
          })
      : [];

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "locationId_required" },
        { status: 400 }
      );
    }

    if (!startsAtRaw) {
      return NextResponse.json(
        { ok: false, error: "startsAt_required" },
        { status: 400 }
      );
    }

    if (!endsAtRaw) {
      return NextResponse.json(
        { ok: false, error: "endsAt_required" },
        { status: 400 }
      );
    }

    const startsAt = new Date(startsAtRaw);
    const endsAt = new Date(endsAtRaw);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: "startsAt_invalid" },
        { status: 400 }
      );
    }

    if (Number.isNaN(endsAt.getTime())) {
      return NextResponse.json(
        { ok: false, error: "endsAt_invalid" },
        { status: 400 }
      );
    }

    if (endsAt <= startsAt) {
      return NextResponse.json(
        { ok: false, error: "invalid_time_range" },
        { status: 400 }
      );
    }

    const durationMs = endsAt.getTime() - startsAt.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes < 5) {
      return NextResponse.json(
        { ok: false, error: "duration_too_short" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        companyId: true,
        title: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "location_not_found" },
        { status: 404 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: location.companyId,
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

    if (selectedServiceIds.length > 0) {
      const services = await prisma.slot_recovery_service.findMany({
        where: {
          id: { in: selectedServiceIds },
          company_id: location.companyId,
        },
        select: {
          id: true,
        },
      });

      if (services.length !== selectedServiceIds.length) {
        return NextResponse.json(
          { ok: false, error: "invalid_selected_services" },
          { status: 400 }
        );
      }
    }

    const serviceName = serviceNameRaw || null;
    const notes = notesRaw || null;

    const created = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot_recovery_slot.create({
        data: {
          company_id: location.companyId,
          location_id: location.id,
          source_appointment_id: sourceAppointmentId || null,
          starts_at: startsAt,
          ends_at: endsAt,
          expires_at: startsAt,
          status: "pending_publish",
          manual_publish_required: true,
          service_name: serviceName,
          notes,
          employee_id: employeeId || null,
        },
        select: {
          id: true,
          company_id: true,
          location_id: true,
          starts_at: true,
          ends_at: true,
          expires_at: true,
          status: true,
          manual_publish_required: true,
          service_name: true,
          notes: true,
          employee_id: true,
          created_at: true,
          Employee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (selectedServiceIds.length > 0) {
        await tx.slot_recovery_slot_service.createMany({
          data: selectedServiceIds.map((serviceId, index) => {
            return {
              slot_recovery_slot_id: slot.id,
              slot_recovery_service_id: serviceId,
              position: index,
            };
          }),
        });
      }

      const persistedServices = await tx.slot_recovery_slot_service.findMany({
        where: {
          slot_recovery_slot_id: slot.id,
        },
        orderBy: {
          position: "asc",
        },
        select: {
          slot_recovery_service: {
            select: {
              id: true,
              name: true,
              duration_min: true,
              price: true,
              active: true,
            },
          },
        },
      });

      return {
        slot,
        services: persistedServices.map((row) => {
          return {
            id: row.slot_recovery_service.id,
            name: row.slot_recovery_service.name,
            durationMin: row.slot_recovery_service.duration_min,
            price: Number(row.slot_recovery_service.price),
            active: row.slot_recovery_service.active,
          };
        }),
      };
    });

    return NextResponse.json({
      ok: true,
      slot: {
        id: created.slot.id,
        companyId: created.slot.company_id,
        locationId: created.slot.location_id,
        startsAt: created.slot.starts_at,
        endsAt: created.slot.ends_at,
        expiresAt: created.slot.expires_at,
        status: created.slot.status,
        manualPublishRequired: created.slot.manual_publish_required,
        serviceName: created.slot.service_name,
        notes: created.slot.notes,
        employeeId: created.slot.employee_id,
        employeeName: created.slot.Employee?.name ?? null,
        createdAt: created.slot.created_at,
        services: created.services,
      },
    });
    } catch (e) {
      console.error("[POST /api/slots/create]", e);

      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          return NextResponse.json(
            { ok: false, error: "slot_already_created_for_appointment" },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        { ok: false, error: "internal_error" },
        { status: 500 }
      );
    }
}