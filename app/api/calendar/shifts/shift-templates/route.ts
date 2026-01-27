// app/api/calendar/shift/shift-templates/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ ok: false, error: "Missing locationId" }, { status: 400 });
    }

    const items = await prisma.locationShiftTemplate.findMany({
      where: { locationId, isActive: true },
      select: {
        id: true,
        name: true,
        startMin: true,
        endMin: true,
        kind: true,
      },
      orderBy: [{ name: "asc" }],
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
