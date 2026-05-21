// app/api/slots/update/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type UpdateSlotBody = {
  slotId?: string;
  startsAt?: string;
  endsAt?: string;
};

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as UpdateSlotBody;

    const slotId = body.slotId?.trim() ?? "";
    const startsAtRaw = body.startsAt?.trim() ?? "";
    const endsAtRaw = body.endsAt?.trim() ?? "";

    if (!slotId) {
      return NextResponse.json({ ok: false, error: "slotId_required" }, { status: 400 });
    }

    if (!startsAtRaw) {
      return NextResponse.json({ ok: false, error: "startsAt_required" }, { status: 400 });
    }

    if (!endsAtRaw) {
      return NextResponse.json({ ok: false, error: "endsAt_required" }, { status: 400 });
    }

    const startsAt = new Date(startsAtRaw);
    const endsAt = new Date(endsAtRaw);

    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ ok: false, error: "startsAt_invalid" }, { status: 400 });
    }

    if (Number.isNaN(endsAt.getTime())) {
      return NextResponse.json({ ok: false, error: "endsAt_invalid" }, { status: 400 });
    }

    if (endsAt <= startsAt) {
      return NextResponse.json({ ok: false, error: "invalid_time_range" }, { status: 400 });
    }

    const slot = await prisma.slot_recovery_slot.findUnique({
      where: { id: slotId },
      select: {
        id: true,
        company_id: true,
        location_id: true,
        status: true,
        recovered_at: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ ok: false, error: "slot_not_found" }, { status: 404 });
    }

    if (slot.recovered_at || slot.status === "recovered") {
      return NextResponse.json({ ok: false, error: "slot_already_recovered" }, { status: 409 });
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: slot.company_id,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.slot_recovery_slot.update({
      where: { id: slot.id },
      data: {
        starts_at: startsAt,
        ends_at: endsAt,
        expires_at: startsAt,
        updated_at: new Date(),
      },
      select: {
        id: true,
        starts_at: true,
        ends_at: true,
        expires_at: true,
      },
    });

    return NextResponse.json({
      ok: true,
      slot: {
        id: updated.id,
        startsAt: updated.starts_at,
        endsAt: updated.ends_at,
        expiresAt: updated.expires_at,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/slots/update]", error);

    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}