// lib/kpis.ts
import { prisma } from "@/lib/prisma";

/** 00:00:00 UTC del día actual (ajústalo a tu TZ si quieres) */
export function todayUtcStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

type KpiCalcInput = {
  companyId: string;
  locationId: string;
  snapshotDate?: Date; // default: hoy 00:00 UTC
};

/** Calcula KPIs y los UPSERTea en LocationKpiDaily (un registro por día y ubicación) */
export async function computeAndSaveLocationDailyKpis({
  companyId,
  locationId,
  snapshotDate = todayUtcStart(),
}: KpiCalcInput) {
  const now = new Date();

  const d7 = new Date(now);
  d7.setDate(now.getDate() - 7);

  const d30 = new Date(now);
  d30.setDate(now.getDate() - 30);

  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);

  // --- Totales base
  const totalReviews = await prisma.review.count({
    where: { companyId, locationId },
  });

  const newReviews7d = await prisma.review.count({
    where: { companyId, locationId, createdAtG: { gte: d7, lte: now } },
  });

  const newReviews30d = await prisma.review.count({
    where: { companyId, locationId, createdAtG: { gte: d30, lte: now } },
  });

  const unansweredCount = await prisma.review.count({
    where: {
      companyId,
      locationId,
      responses: { none: { status: "PUBLISHED", active: true } },
    },
  });

  const answeredRate =
    totalReviews > 0
      ? Math.round(((totalReviews - unansweredCount) / totalReviews) * 100)
      : 0;

  // --- Medias (global y por ventanas)
  // Global
  const allRatings = await prisma.review.findMany({
    where: { companyId, locationId },
    select: { rating: true },
  });
  const avgAll =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
      : null;

  // Últimos 30 días
  const ratings30 = await prisma.review.findMany({
    where: {
      companyId,
      locationId,
      createdAtG: { gte: d30, lte: now },
    },
    select: { rating: true },
  });
  const avg30d =
    ratings30.length > 0
      ? ratings30.reduce((s, r) => s + r.rating, 0) / ratings30.length
      : null;

  // 30 días anteriores
  const ratingsPrev30 = await prisma.review.findMany({
    where: {
      companyId,
      locationId,
      createdAtG: { gte: prev30Start, lt: d30 },
    },
    select: { rating: true },
  });
  const prev30dAvg =
    ratingsPrev30.length > 0
      ? ratingsPrev30.reduce((s, r) => s + r.rating, 0) / ratingsPrev30.length
      : null;

  // --- Respuestas publicadas últimos 7 días
  const responses7d = await prisma.response.count({
    where: {
      review: { companyId, locationId },
      status: "PUBLISHED",
      active: true,
      publishedAt: { gte: d7, lte: now },
    },
  });

  // --- Tiempo medio de respuesta (últimos 30 días)
  const reviews30 = await prisma.review.findMany({
    where: {
      companyId,
      locationId,
      createdAtG: { gte: d30, lte: now },
    },
    select: {
      createdAtG: true,
      responses: {
        where: {
          status: "PUBLISHED",
          active: true,
          publishedAt: { not: null },
        },
        select: { publishedAt: true },
        orderBy: { publishedAt: "asc" },
        take: 1,
      },
    },
  });

  const diffsSec: number[] = [];
  for (const r of reviews30) {
    const created = r.createdAtG ?? null;
    const publishedAt = r.responses[0]?.publishedAt ?? null;
    if (created && publishedAt) {
      const diff = (publishedAt.getTime() - created.getTime()) / 1000;
      if (diff >= 0) diffsSec.push(diff);
    }
  }
  const responseAvgSec =
    diffsSec.length > 0
      ? Math.round(diffsSec.reduce((s, n) => s + n, 0) / diffsSec.length)
      : null;

  // Guardado (usamos number directamente para Decimal)
  const data = {
    companyId,
    locationId,
    snapshotDate,
    totalReviews,
    newReviews7d,
    newReviews30d,
    unansweredCount,
    answeredRate,
    avgAll,
    avg30d,
    prev30dAvg,
    responses7d,
    responseAvgSec,
    lastComputedAt: new Date(),
  };

  // UPSERT por (locationId, snapshotDate)
  await prisma.locationKpiDaily.upsert({
    where: { locationId_snapshotDate: { locationId, snapshotDate } },
    update: data,
    create: data,
  });

  return data;
}
