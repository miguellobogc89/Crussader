// app/api/slots/activity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json(
        { ok: false, error: "Missing locationId" },
        { status: 400 }
      );
    }

    const activities = await prisma.slot_recovery_activity.findMany({
      where: {
        location_id: locationId,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 20,
    });

    const items = activities.map((item) => {
        return {
            id: item.id,
            text: item.title,
            time: item.created_at,
            status: item.event_type,
            payload: item.payload,
        };
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    console.error("GET /api/slots/activity error", error);

    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}