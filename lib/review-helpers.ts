// lib/review-helpers.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Recalcula y actualiza reviewsCount y reviewsAvg de una Location
 * tras insertar (o borrar) reviews.
 */
export async function recalcLocationAggregates(locationId: string) {
  const agg = await prisma.review.aggregate({
    where: { locationId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const reviewsCount = agg._count._all ?? 0;
  const reviewsAvg = agg._avg.rating != null ? Number(agg._avg.rating) : null;

  await prisma.location.update({
    where: { id: locationId },
    data: { reviewsCount, reviewsAvg },
  });
}