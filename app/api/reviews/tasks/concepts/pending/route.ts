// app/api/reviews/tasks/concepts/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");

  if (!locationId) {
    return NextResponse.json(
      { ok: false, error: "locationId requerido", pending: 0 },
      { status: 400 },
    );
  }

  // 💡 MUY IMPORTANTE:
  // Usamos EXACTAMENTE el mismo filtro que el route /process:
  //
  //   - misma locationId
  //   - isTest = false
  //   - is_conceptualized = false
  //   - comment no nulo ni vacío
  //
  // Así el número de "pendientes" coincide con lo que realmente
  // puede procesar el extractor.

  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Review" r
    WHERE r."locationId" = ${locationId}
      AND COALESCE(r."isTest", false) = false
      AND COALESCE(r.is_conceptualized, false) = false
      AND COALESCE(NULLIF(TRIM(r.comment), ''), NULL) IS NOT NULL
  `;

  const count = rows[0]?.count ?? 0n;

  return NextResponse.json({
    ok: true,
    pending: Number(count),
  });
}
