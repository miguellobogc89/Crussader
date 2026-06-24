// app/api/integrations/google/calendar/backfill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { subMonths } from "date-fns";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createGoogleEventForAppointment } from "@/lib/integrations/google-calendar/appointments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const locationId = typeof body.locationId === "string" ? body.locationId : null;

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "missing_location_id" },
        { status: 400 }
      );
    }

    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { companyId: true },
    });

    if (!location) {
      return NextResponse.json(
        { ok: false, error: "location_not_found" },
        { status: 404 }
      );
    }

    const crussaderCalendar = await prisma.external_calendar.findFirst({
      where: {
        company_id: location.companyId,
        location_id: locationId,
        provider: "google-calendar",
        purpose: "crussader_mirror",
        active: true,
        external_calendar_id: {
          not: "",
        },
      },
      select: { id: true },
    });

    if (!crussaderCalendar) {
      return NextResponse.json(
        { ok: false, error: "crussader_mirror_calendar_not_found", message: "Must connect Google Calendar and sync calendars first" },
        { status: 400 }
      );
    }

    const cleanupThreshold = new Date();
    cleanupThreshold.setHours(cleanupThreshold.getHours() - 1);

    await prisma.appointment.updateMany({
      where: {
        locationId,
        externalProvider: "google-calendar-pending",
        updatedAt: { lt: cleanupThreshold },
      },
      data: {
        externalProvider: null,
        externalEventId: null,
      },
    });

    const from = subMonths(new Date(), 3);

    const appointments = await prisma.appointment.findMany({
      where: {
        locationId,
        startAt: { gte: from },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.BOOKED],
        },
        externalEventId: null,
        OR: [
          { externalProvider: null },
          { externalProvider: "" },
        ],
      },
      select: { id: true },
      orderBy: { startAt: "asc" },
    });

    let exported = 0;
    let failed = 0;

    for (const appointment of appointments) {
      try {
        const locked = await prisma.appointment.updateMany({
          where: {
            id: appointment.id,
            externalEventId: null,
            OR: [
              { externalProvider: null },
              { externalProvider: "" },
            ],
          },
          data: {
            externalProvider: "google-calendar-pending",
          },
        });

        if (locked.count !== 1) {
          continue;
        }

        const result = await createGoogleEventForAppointment(appointment.id);

        if (result?.id) {
          exported += 1;
        } else {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              externalProvider: null,
              externalEventId: null,
            },
          });
          failed += 1;
        }
      } catch (error) {
        console.error("[google.calendar.backfill] failed", {
          appointmentId: appointment.id,
          error,
        });

        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            externalProvider: null,
            externalEventId: null,
          },
        }).catch(() => null);

        failed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      total: appointments.length,
      exported,
      failed,
      message: failed > 0 ? "some_exports_failed" : "all_exports_successful",
    });
  } catch (error: any) {
    console.error("[google.calendar.backfill.POST]", error);

    return NextResponse.json(
      { ok: false, error: error?.message || "internal_error" },
      { status: 500 }
    );
  }
}