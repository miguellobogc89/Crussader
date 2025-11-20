// app/api/mybusiness/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const locationId = id;

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "missing_location_id" },
      { status: 400 },
    );
  }

  try {
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        companyId: true,
        title: true,
      },
    });

    if (!loc) {
      return NextResponse.json(
        { ok: false, error: "location_not_found", location: null },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        location: {
          id: loc.id,
          companyId: loc.companyId,
          name: loc.title,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[mybusiness][locations][GET] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
