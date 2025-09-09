// app/api/kpis/locations-today/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { todayUtcStart } from "@/lib/kpis";

export async function GET() {
  // Sesión
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  // Empresa activa (la primera por ahora)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });

  const membership = await prisma.userCompany.findFirst({
    where: { userId: user.id },
    select: { companyId: true },
    orderBy: { createdAt: "asc" },
  });
  const companyId = membership?.companyId ?? null;
  if (!companyId) return NextResponse.json({ ok: true, data: [] });

  const snapshotDate = todayUtcStart();

  // Traemos KPIs + metadata de Location
  const kpis = await prisma.locationKpiDaily.findMany({
    where: { companyId, snapshotDate },
    select: {
      locationId: true,
      totalReviews: true,
      newReviews7d: true,
      newReviews30d: true,
      unansweredCount: true,
      answeredRate: true,
      avgAll: true,
      avg30d: true,
      prev30dAvg: true,
      responses7d: true,
      responseAvgSec: true,
      location: {
        select: { title: true, slug: true, status: true },
      },
    },
    orderBy: [{ totalReviews: "desc" }],
  });

  const rows = kpis.map((r) => ({
    locationId: r.locationId,
    title: r.location.title,
    slug: r.location.slug,
    status: r.location.status,
    totals: {
      totalReviews: r.totalReviews,
      newReviews7d: r.newReviews7d,
      newReviews30d: r.newReviews30d,
      unansweredCount: r.unansweredCount,
      responses7d: r.responses7d,
    },
    rates: {
      answeredRate: r.answeredRate,
      avgAll: r.avgAll ? Number(r.avgAll) : null,
      avg30d: r.avg30d ? Number(r.avg30d) : null,
      prev30dAvg: r.prev30dAvg ? Number(r.prev30dAvg) : null,
      responseAvgSec: r.responseAvgSec,
    },
  }));

  return NextResponse.json({ ok: true, data: rows });
}
