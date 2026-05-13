// app/api/slots/send/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slotId")?.trim() ?? "";

    if (!slotId) {
      return NextResponse.json(
        { ok: false, error: "slotId_required" },
        { status: 400 }
      );
    }

    const sends = await prisma.slot_recovery_send.findMany({
      where: { slotId },
      select: {
        sent_at: true,
        read_at: true,
      },
    });

    const rejected = await prisma.slot_recovery_recipient.count({
      where: {
        slot_recovery_slot_id: slotId,
        status: "declined",
      },
    });

    const interested = await prisma.slot_recovery_recipient.count({
      where: {
        slot_recovery_slot_id: slotId,
        status: "booked",
      },
    });

    const sent = sends.length;

    const notRead = sends.filter((item) => {
      return item.sent_at && !item.read_at;
    }).length;

    return NextResponse.json({
      ok: true,
      summary: {
        sent,
        interested,
        rejected,
        notRead,
      },
    });
  } catch (error) {
    console.error("[GET /api/slots/send/summary]", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}