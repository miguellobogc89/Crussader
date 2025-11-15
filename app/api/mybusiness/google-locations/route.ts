// app/api/mybusiness/google-locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId requerido" },
      { status: 400 },
    );
  }

  try {
    const rows = await prisma.google_gbp_location.findMany({
      where: {
        company_id: companyId,
        is_active: true,   // ✅ solo activas
        location_id: null,  // ✅ solo NO vinculadas aún
      },
      orderBy: { created_at: "asc" },
    });

    const locations = rows.map((r) => ({
      id: r.id, // UUID de google_gbp_location
      google_location_title: r.google_location_title,
      title:
        r.google_location_title ??
        r.title ??
        "Sin nombre",
      address: r.address ?? "",
      google_location_id: r.google_location_id ?? null, // "accounts/.../locations/..."
    }));

    return NextResponse.json(
      { locations },
      { status: 200 },
    );
  } catch (err) {
    console.error("[mybusiness][google-locations] error", err);
    return NextResponse.json(
      {
        error: "Error interno al cargar ubicaciones de Google para esta empresa.",
      },
      { status: 500 },
    );
  }
}
