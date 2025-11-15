// app/api/mybusiness/locations/[locationId]/unlink-google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: { locationId: string } },
) {
  const locationId = context.params.locationId;

  if (!locationId) {
    return NextResponse.json(
      { error: "locationId requerido en la ruta" },
      { status: 400 },
    );
  }

  try {
    const loc = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!loc) {
      return NextResponse.json(
        { error: "Location no encontrada" },
        { status: 404 },
      );
    }

    const gbpLoc = await prisma.google_gbp_location.findFirst({
      where: { location_id: locationId },
    });

    const result = await prisma.$transaction(async (tx) => {
      const updatedLocation = await tx.location.update({
        where: { id: locationId },
        data: {
          googleLocationId: null,
          googlePlaceId: null,
          googleAccountId: null,
          externalConnectionId: null,
        },
      });

      let updatedGbpLocation = null;
      if (gbpLoc) {
        updatedGbpLocation = await tx.google_gbp_location.update({
          where: { id: gbpLoc.id },
          data: {
            location_id: null,
            status: "unlinked",
          },
        });
      }

      return { updatedLocation, updatedGbpLocation };
    });

    return NextResponse.json(
      {
        ok: true,
        unlinked: {
          locationId: result.updatedLocation.id,
          gbpLocationId: result.updatedGbpLocation?.id ?? null,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[mybusiness][unlink-google] error", err);
    return NextResponse.json(
      {
        error: "Error interno al desvincular ubicación",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
