// app/api/kpis/company-today/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { todayUtcStart } from "@/lib/kpis";

/**
 * Agrega KPIs de todas las ubicaciones de la empresa activa para el snapshot de HOY.
 * - Usa media ponderada para ratings.
 * - answeredRate = (sum answered / sum total) * 100
 * - responseAvgSec = media simple entre ubicaciones que tengan valor.
 */
export async function GET() {
  try {
    // 1) Sesión
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    // 2) Usuario -> empresa activa (la primera relación por ahora)
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
    if (!companyId) {
      return NextResponse.json({
        ok: true,
        data: {
          companyId: null,
          snapshotDate: null,
          totals: { totalReviews: 0, newReviews7d: 0, newReviews30d: 0, unansweredCount: 0, responses7d: 0 },
          rates: { answeredRate: 0, avgAll: null, avg30d: null, prev30dAvg: null, responseAvgSec: null },
          locations: 0,
        },
      });
    }

    // 3) Snapshots de HOY por ubicación
    const snapshotDate = todayUtcStart();
    const rows = await prisma.locationKpiDaily.findMany({
      where: { companyId, snapshotDate },
      select: {
        locationId: true,
        totalReviews: true,
        newReviews7d: true,
        newReviews30d: true,
        unansweredCount: true,
        answeredRate: true, // no lo usamos directamente para el agregado
        avgAll: true,
        avg30d: true,
        prev30dAvg: true,
        responses7d: true,
        responseAvgSec: true,
      },
    });

    if (rows.length === 0) {
      // Si hoy todavía no hay snapshot, devolvemos estructura vacía pero coherente
      return NextResponse.json({
        ok: true,
        data: {
          companyId,
          snapshotDate: snapshotDate.toISOString(),
          totals: { totalReviews: 0, newReviews7d: 0, newReviews30d: 0, unansweredCount: 0, responses7d: 0 },
          rates: { answeredRate: 0, avgAll: null, avg30d: null, prev30dAvg: null, responseAvgSec: null },
          locations: 0,
        },
      });
    }

    // 4) Agregados
    let totalReviews = 0;
    let newReviews7d = 0;
    let newReviews30d = 0;
    let unansweredCount = 0;
    let responses7d = 0;

    // Para medias ponderadas
    let sumAvgAllWeighted = 0;     // Σ (avgAll_i * totalReviews_i)
    let sumAvg30Weighted = 0;      // Σ (avg30d_i * newReviews30d_i)
    let sumPrev30Weighted = 0;     // Σ (prev30dAvg_i * newReviews30d_i)  (aprox. misma ventana)
    let weightAll = 0;             // Σ totalReviews_i
    let weight30 = 0;              // Σ newReviews30d_i

    // Para tiempo medio de respuesta (media simple entre ubicaciones con dato)
    let sumResponseSec = 0;
    let countResponseSec = 0;

    for (const r of rows) {
      totalReviews += r.totalReviews;
      newReviews7d += r.newReviews7d;
      newReviews30d += r.newReviews30d;
      unansweredCount += r.unansweredCount;
      responses7d += r.responses7d;

      if (r.avgAll !== null) {
        sumAvgAllWeighted += Number(r.avgAll) * r.totalReviews;
      }
      if (r.avg30d !== null) {
        sumAvg30Weighted += Number(r.avg30d) * r.newReviews30d;
      }
      if (r.prev30dAvg !== null) {
        sumPrev30Weighted += Number(r.prev30dAvg) * r.newReviews30d;
      }
      weightAll += r.totalReviews;
      weight30 += r.newReviews30d;

      if (r.responseAvgSec !== null) {
        sumResponseSec += r.responseAvgSec;
        countResponseSec += 1;
      }
    }

    const answered = totalReviews - unansweredCount;
    const answeredRate = totalReviews > 0 ? Math.round((answered / totalReviews) * 100) : 0;

    const avgAll =
      weightAll > 0 ? parseFloat((sumAvgAllWeighted / weightAll).toFixed(2)) : null;

    const avg30d =
      weight30 > 0 ? parseFloat((sumAvg30Weighted / weight30).toFixed(2)) : null;

    const prev30dAvg =
      weight30 > 0 ? parseFloat((sumPrev30Weighted / weight30).toFixed(2)) : null;

    const responseAvgSec =
      countResponseSec > 0 ? Math.round(sumResponseSec / countResponseSec) : null;

    return NextResponse.json({
      ok: true,
      data: {
        companyId,
        snapshotDate: snapshotDate.toISOString(),
        totals: { totalReviews, newReviews7d, newReviews30d, unansweredCount, responses7d },
        rates: { answeredRate, avgAll, avg30d, prev30dAvg, responseAvgSec },
        locations: rows.length,
      },
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message ?? "kpis_company_failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
