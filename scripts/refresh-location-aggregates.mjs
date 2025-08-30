import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  try {
    // saca todas las locations
    const locations = await prisma.location.findMany({ select: { id: true } });

    for (const loc of locations) {
      const agg = await prisma.review.aggregate({
        where: { locationId: loc.id },
        _avg: { rating: true },
        _count: { _all: true },
      });

      const reviewsCount = agg._count._all ?? 0;
      const reviewsAvg = agg._avg.rating != null ? Number(agg._avg.rating) : null;

      await prisma.location.update({
        where: { id: loc.id },
        data: {
          reviewsCount,
          reviewsAvg,
        },
      });
    }

    console.log("✅ Agregados de reviews refrescados en Location.");
  } catch (e) {
    console.error("❌ Error refrescando agregados:", e);
  } finally {
    await prisma.$disconnect();
  }
})();
