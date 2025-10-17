// app/api/reviews/tasks/concepts/pending/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });

  const [row] = await prisma.$queryRaw<{ n: string }[]>`
    SELECT COUNT(*)::text AS n
    FROM "Review" r
    WHERE r."locationId" = ${locationId}
      AND COALESCE(r."isTest", false) = false
      AND COALESCE(r.is_conceptualized, false) = false
      AND COALESCE(NULLIF(TRIM(r.comment), ''), NULL) IS NOT NULL
  `;
  return NextResponse.json({ ok: true, pending: Number(row?.n ?? "0") });
}
