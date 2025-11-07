// app/api/integrations/google/business-profile/locations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { companyId, externalConnectionId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId requerido" },
        { status: 400 },
      );
    }

    const provider = "GBP";

    // Construimos filtro dinámico
    const params: any[] = [provider, companyId];
    let filterExtConn = "";
    if (externalConnectionId) {
      params.push(externalConnectionId);
      filterExtConn = `AND external_connection_id = $3`;
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        id,
        external_location_name      AS "externalLocationName",
        title,
        address,
        COALESCE(rating, 0)         AS rating,
        COALESCE(total_review_count, 0) AS "totalReviewCount",
        status
      FROM external_location_mapping
      WHERE provider = $1
        AND company_id = $2
        ${filterExtConn}
      ORDER BY created_at ASC, id ASC
      `,
      ...params,
    );

    // TODO: aquí deberías calcular maxConnectable según plan / entitlement.
    const maxConnectable = 1;

    return NextResponse.json({
      locations: rows,
      maxConnectable,
    });
  } catch (error) {
    console.error("[GBP][locations] error", error);
    return NextResponse.json(
      { error: "Error interno al cargar ubicaciones" },
      { status: 500 },
    );
  }
}
