// app/api/slots/kpis/route.ts
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

    const totalSlots = await prisma.slot_recovery_slot.count({
      where: {
        company_id: location.companyId,
        location_id: locationId,
      },
    });

    const recoveredSlots = await prisma.slot_recovery_slot.findMany({
      where: {
        company_id: location.companyId,
        location_id: locationId,
        OR: [{ status: "recovered" }, { recovered_at: { not: null } }],
      },
      select: {
        id: true,
        Appointment_slot_recovery_slot_recovered_appointment_idToAppointment: {
          select: {
            servicePrice: true,
          },
        },
        slot_recovery_service: {
          select: {
            price: true,
          },
        },
      },
    });

    const recovered = recoveredSlots.length;

    const recoveredAmount = recoveredSlots.reduce((sum, slot) => {
      const appointmentPrice =
        slot.Appointment_slot_recovery_slot_recovered_appointment_idToAppointment
          ?.servicePrice;

      if (appointmentPrice != null) {
        return sum + Number(appointmentPrice);
      }

      const fallbackPrice = slot.slot_recovery_service?.price;

      if (fallbackPrice != null) {
        return sum + Number(fallbackPrice);
      }

      return sum;
    }, 0);

    const sentRecipients = await prisma.slot_recovery_recipient.count({
      where: {
        company_id: location.companyId,
        sent_at: { not: null },
        slot_recovery_slot: {
          location_id: locationId,
        },
      },
    });

    const bookedRecipients = await prisma.slot_recovery_recipient.count({
      where: {
        company_id: location.companyId,
        booked_at: { not: null },
        slot_recovery_slot: {
          location_id: locationId,
        },
      },
    });

    const bookingConversion =
      sentRecipients > 0
        ? Math.round((bookedRecipients / sentRecipients) * 100)
        : 0;

    return NextResponse.json({
      ok: true,
      kpis: {
        recovered,
        recoveredTotal: totalSlots,
        recoveredAmount,
        bookingConversion,
      },
    });
  } catch (e) {
    console.error("[GET /api/slots/kpis]", e);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}