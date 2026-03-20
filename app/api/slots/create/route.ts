// app/api/slots/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type CreateSlotBody = {
  locationId?: string;
  startsAt?: string;
  endsAt?: string;
  serviceName?: string;
  notes?: string;
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

    const locationId = body.locationId?.trim();
    const startsAtRaw = body.startsAt?.trim();
    const endsAtRaw = body.endsAt?.trim();
    const serviceNameRaw = body.serviceName?.trim();
    const notesRaw = body.notes?.trim();

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

    const serviceName = serviceNameRaw ? serviceNameRaw : null;
    const notes = notesRaw ? notesRaw : null;

    const slot = await prisma.slot_recovery_slot.create({
      data: {
        company_id: location.companyId,
        location_id: location.id,
        starts_at: startsAt,
        ends_at: endsAt,
        expires_at: startsAt,
        status: "pending_publish",
        manual_publish_required: true,
        service_name: serviceName,
        notes,
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
        created_at: true,
      },
    });

    return NextResponse.json({
      ok: true,
      slot: {
        id: slot.id,
        companyId: slot.company_id,
        locationId: slot.location_id,
        startsAt: slot.starts_at,
        endsAt: slot.ends_at,
        expiresAt: slot.expires_at,
        status: slot.status,
        manualPublishRequired: slot.manual_publish_required,
        serviceName: slot.service_name,
        notes: slot.notes,
        createdAt: slot.created_at,
      },
    });
  } catch (e) {
    console.error("[POST /api/slots/create]", e);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}