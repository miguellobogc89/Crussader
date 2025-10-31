// app/api/reviews/kpis/trends/hourly/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });

  const membership = await prisma.userCompany.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
    orderBy: { createdAt: "asc" },
  });
  const defaultCompanyId = membership?.companyId ?? null;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId") ?? defaultCompanyId ?? undefined;
  const locationId = searchParams.get("locationId") ?? undefined;
  const from = searchParams.get("from")!;
  const to = searchParams.get("to")!;

  if (!companyId) return NextResponse.json({ ok: true, data: [] });
  if (!from || !to) {
    return NextResponse.json({ ok: false, error: "Missing from/to (YYYY-MM-DD)" }, { status: 400 });
  }

  const filters = [
    `"companyId" = $1`,
    `"monthDate" >= $2::date`,
    `"monthDate" <  $3::date`,
  ];
  const params: any[] = [companyId, from, to];
  let idx = 4;

  if (locationId) { filters.push(`"locationId" = $${idx++}`); params.push(locationId); }

  const sql = `
    WITH rows AS (
      SELECT "hourlyCounts"
      FROM "LocationReviewHourlyMonthly"
      WHERE ${filters.join(" AND ")}
    ),
    exploded AS (
      SELECT val::int AS v, ord::int AS pos
      FROM rows, unnest("hourlyCounts") WITH ORDINALITY AS u(val, ord)
    )
    SELECT (pos - 1) AS hour, SUM(v)::int AS reviews
    FROM exploded
    GROUP BY pos
    ORDER BY pos;
  `;

  const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
  const map = new Map<number, number>();
  rows.forEach(r => map.set(Number(r.hour), Number(r.reviews)));
  const data = Array.from({ length: 24 }, (_, h) => ({ hour: h, reviews: map.get(h) ?? 0 }));

  return NextResponse.json({ ok: true, data });
}
