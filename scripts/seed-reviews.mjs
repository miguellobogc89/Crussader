// scripts/seed-reviews.mjs
import { PrismaClient } from "@prisma/client";
import { recalcLocationAggregates } from "../lib/review-helpers.js";

const prisma = new PrismaClient();

// ⚠️ Sustituye por un id real de Location (míralo en Prisma Studio)
const LOCATION_ID = "cmex4y6170006l1045mis2epa";

const reviews = [
  {
    rating: 5,
    reviewerName: "María González",
    comment: "Excelente atención y calidad.",
  },
  {
    rating: 4,
    reviewerName: "Juan Pérez",
    comment: "Muy buen servicio aunque algo de espera.",
  },
  {
    rating: 3,
    reviewerName: "Ana López",
    comment: "Correcto, podría mejorar la atención.",
  },
];

async function main() {
  for (const r of reviews) {
    await prisma.review.create({
      data: {
        locationId: LOCATION_ID,
        rating: r.rating,
        reviewerName: r.reviewerName,
        comment: r.comment,
        createdAtG: new Date(),
        ingestedAt: new Date(),
      },
    });
  }

  // 👇 recalculamos agregados al final
  await recalcLocationAggregates(LOCATION_ID);

  console.log(`✅ Insertadas ${reviews.length} reviews en location ${LOCATION_ID}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seed reviews:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
