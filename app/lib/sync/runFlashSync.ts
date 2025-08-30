// app/lib/sync/runFlashSync.ts
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

type FlashSyncOptions = {
  locationId: string;
  windowMonths: number;
  maxReviews: number;
};

type FlashSyncResult = {
  imported: number;
  info: string;
};

export async function runFlashSync(opts: FlashSyncOptions): Promise<FlashSyncResult> {
  const { locationId, windowMonths, maxReviews } = opts;

  // 1) Local + conexión asociada
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, companyId: true, externalConnectionId: true },
  });
  if (!location) throw new Error(`Location ${locationId} not found`);

  const connection = location.externalConnectionId
    ? await prisma.externalConnection.findUnique({
        where: { id: location.externalConnectionId },
      })
    : null;

  if (!connection) {
    // Si aún no hay conexión enlazada al location, no podemos sincronizar
    throw new Error(`No ExternalConnection linked to location ${locationId}`);
  }

  // 2) (Por ahora MOCK) — aquí iría la llamada real a Google
  const now = new Date();
  const reviewsFromApi: Array<{
    externalId: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: Date;
    reply?: { content: string; createdAt: Date };
  }> = [
    {
      externalId: "mock-1",
      author: "Cliente 1",
      rating: 5,
      comment: "¡Excelente helado!",
      createdAt: now,
    },
    {
      externalId: "mock-2",
      author: "Cliente 2",
      rating: 4,
      comment: "Muy buena atención",
      createdAt: now,
    },
  ];

  // 3) Insert idempotente (findFirst + create)
  let imported = 0;

  for (const r of reviewsFromApi.slice(0, maxReviews)) {
    // ¿ya existe esta review (por externalId + locationId)?
    const exists = await prisma.review.findFirst({
      where: { locationId, externalId: r.externalId, provider: "GOOGLE" },
      select: { id: true },
    });
    if (exists) continue;

    // crea la review
    const createdReview = await prisma.review.create({
      data: {
        // id: se autogenera por Prisma
        companyId: location.companyId,   // ✅ requerido por tu schema
        locationId,
        provider: "GOOGLE",              // ✅ enum requerido
        externalId: r.externalId,
        rating: r.rating,
        comment: r.comment,
        reviewerName: r.author,
        createdAtG: r.createdAt,
        ingestedAt: new Date(),
      },
      select: { id: true },
    });
    imported++;


  }

  // 4) Recalcular agregados de la ubicación
  const agg = await prisma.review.aggregate({
    where: { locationId },
    _avg: { rating: true },
    _count: { id: true },
  });

  const avg = agg._avg.rating != null ? Number(agg._avg.rating) : 0;
  const count = agg._count.id ?? 0;

  await prisma.location.update({
    where: { id: locationId },
    data: {
      reviewsAvg: avg,
      reviewsCount: count,
      lastSyncAt: new Date(),
    },
  });

  return {
    imported,
    info: `Flash sync finished for location ${locationId}, ${imported} reviews imported`,
  };
}
