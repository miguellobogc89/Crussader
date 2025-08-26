import { PrismaClient, ReviewProvider } from "@prisma/client";

const prisma = new PrismaClient();

// Los dos locations de Zara (los pasaste tú)
const LOCATION_IDS = [
  "cmerh0w8a0003i550vjfeull3",
  "cmeregkwf0001i5508jf9o8h5",
];

// helpers
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NAMES = ["Juan","María","Carlos","Ana","Miguel","Lucía","Pedro","Sofía","David","Laura","Javier","Sara","Pablo","Marta","Raúl","Carmen","Hugo","Irene","Alberto","Noelia"];
const COMMENTS_POS = [
  "Excelente atención y variedad.",
  "Todo perfecto, muy recomendable.",
  "Calidad/precio inmejorable.",
  "Me atendieron rápido y con amabilidad.",
  "Muy buena experiencia de compra.",
];
const COMMENTS_NEU = [
  "Correcto sin más.",
  "Bien, aunque podría mejorar.",
  "Experiencia normal.",
  "Surtido aceptable.",
];
const COMMENTS_NEG = [
  "Esperaba más, algo decepcionante.",
  "Tiempos de espera largos.",
  "No quedé satisfecho con la atención.",
  "Problemas con la devolución.",
];

function buildComment(rating: number): string {
  if (rating >= 4) return sample(COMMENTS_POS);
  if (rating === 3) return sample(COMMENTS_NEU);
  return sample(COMMENTS_NEG);
}

function makeFakeReview(companyId: string, locationId: string, idx: number) {
  const rating = randInt(1, 5);
  const created = new Date(Date.now() - randInt(3, 300) * 24 * 60 * 60 * 1000); // entre 3 y 300 días
  const maybeReply = rating <= 2 ? "Lamentamos lo ocurrido. Escríbenos y lo resolvemos." : undefined;

  return {
    companyId,
    locationId,
    provider: ReviewProvider.GOOGLE,
    externalId: `${locationId}/reviews/fake_${idx}`, // simula name de Google
    reviewerName: sample(NAMES),
    reviewerPhoto: "https://via.placeholder.com/48",
    reviewerAnon: false,
    rating,
    comment: buildComment(rating),
    languageCode: "es",
    createdAtG: created,
    updatedAtG: created,
    replyComment: maybeReply,
    replyUpdatedAtG: maybeReply ? new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
  };
}

async function seedForLocation(locationId: string) {
  // buscamos companyId del location
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: { id: true, companyId: true },
  });
  if (!loc) {
    console.warn(`⚠️  Location no encontrado: ${locationId}`);
    return;
  }

  const n = randInt(10, 20);
  const batch = Array.from({ length: n }, (_, i) =>
    makeFakeReview(loc.companyId, loc.id, i + 1),
  );

  // insertamos (skip duplicates por si se re-ejecuta)
  await prisma.review.createMany({ data: batch, skipDuplicates: true });

  // recalculamos KPIs del location
  const agg = await prisma.review.groupBy({
    by: ["locationId"],
    where: { locationId: loc.id },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const count = agg[0]?._count._all ?? 0;
  const avg = agg[0]?._avg.rating ?? null;

  await prisma.location.update({
    where: { id: loc.id },
    data: {
      reviewsCount: count,
      reviewsAvg: avg ? Number(avg.toFixed(2)) : null,
      updatedAt: new Date(),
    },
  });

  console.log(`✅ ${n} reviews para ${loc.id} (count=${count}, avg=${avg?.toFixed?.(2) ?? "—"})`);
}

async function main() {
  for (const id of LOCATION_IDS) {
    await seedForLocation(id);
  }
}

main()
  .then(() => console.log("✅ Seed de reviews completado"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
