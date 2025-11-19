// app/api/integrations/google/business-profile/locations/activate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyId = (body.companyId ?? "").trim();
    const selectedIds = Array.isArray(body.selectedIds)
      ? (body.selectedIds as string[])
      : [];

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    // Normalizamos los IDs (son IDs de google_gbp_location.id)
    const normalized = selectedIds
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);

    // 1) Todas las locations GBP de esta empresa -> is_active = false
    await prisma.google_gbp_location.updateMany({
      where: { company_id: companyId },
      data: { is_active: false },
    });

    let linkedLocationId: string | null = null;
    let linkedGbpLocationId: string | null = null;

    if (normalized.length > 0) {
      // 2) Activar solo las seleccionadas (por id de google_gbp_location)
      await prisma.google_gbp_location.updateMany({
        where: {
          company_id: companyId,
          id: { in: normalized },
        },
        data: {
          is_active: true,
          status: "active",
        },
      });

      // Tomamos solo la primera (el flujo actual es 1 selección)
      const primaryGbpId = normalized[0];

      // Última Location creada por esta company
      const lastLocation = await prisma.location.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });

      if (lastLocation) {
        linkedLocationId = lastLocation.id;
        linkedGbpLocationId = primaryGbpId;

        // Cargamos la GBP para leer google_location_id y la cuenta
        const gbpLoc = await prisma.google_gbp_location.findUnique({
          where: { id: primaryGbpId },
          include: {
            google_gbp_account: true,
          },
        });

        if (gbpLoc) {
          // 3) Enlazar GBP -> Location
          await prisma.google_gbp_location.update({
            where: { id: primaryGbpId },
            data: {
              location_id: lastLocation.id,
              is_active: true,
              status: "active",
            },
          });

          // 4) Enlazar Location -> datos de Google
          await prisma.location.update({
            where: { id: lastLocation.id },
            data: {
              googleLocationId: gbpLoc.google_location_id,
              googleAccountId:
                gbpLoc.google_gbp_account?.google_account_id ?? undefined,
              googlePlaceId: gbpLoc.place_id ?? undefined,
              // googleName podrías setearlo también si quieres:
              // googleName: gbpLoc.title ?? gbpLoc.google_location_title ?? undefined,
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        activatedCount: normalized.length,
        activatedIds: normalized,
        linkedLocationId,
        linkedGbpLocationId,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[GBP][locations/activate] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: String(err),
      },
      { status: 500 },
    );
  }
}
