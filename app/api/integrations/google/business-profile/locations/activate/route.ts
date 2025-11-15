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

    // Aunque selectedIds pueda estar vacío, no devolvemos error:
    //  -> Significa "ninguna ubicación activa".
    const normalized = selectedIds.map((s) => String(s).trim());
    const selectedSet = new Set(normalized);

    // 1) Todas las locations de esta empresa -> is_active = false
    await prisma.google_gbp_location.updateMany({
      where: { company_id: companyId },
      data: { is_active: false },
    });

    // 2) Activar solo las seleccionadas
    if (normalized.length > 0) {
      await prisma.google_gbp_location.updateMany({
        where: {
          company_id: companyId,
          google_location_id: { in: normalized },
        },
        data: { is_active: true },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        activatedCount: normalized.length,
        activatedIds: normalized,
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
