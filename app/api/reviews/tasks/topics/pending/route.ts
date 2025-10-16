// app/api/reviews/tasks/topics/pending/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const recencyDays = Math.max(1, Number(searchParams.get("recencyDays") ?? 180));

    if (!locationId) return NextResponse.json({ ok: false, error: "locationId requerido" }, { status: 400 });

    const rows = await prisma.$queryRaw<{ n: string }[]>`
      SELECT COUNT(*)::text AS n
      FROM concept c
      JOIN "Review" r ON r.id = c.review_id
      LEFT JOIN topic t ON t.id = c.topic_id
      WHERE r."locationId" = ${locationId}
        AND COALESCE(r."createdAtG", r."ingestedAt") >= now() - (${recencyDays}::int || ' days')::interval
        AND (c.topic_id IS NULL OR COALESCE(t.is_stable, false) = false)
    `;

    return NextResponse.json({ ok: true, pending: Number(rows?.[0]?.n ?? "0") });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}
export const revalidate = 0;
