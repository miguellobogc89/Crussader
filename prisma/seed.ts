import { PrismaClient, ReviewProvider } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

type SeedReview = {
  author: string;
  rating: number;      // 1..5
  business: string;
  text: string;
  createdAt: Date;     // -> createdAtG
};

const SEED_REVIEWS: SeedReview[] = [
  {
    author: "Nadia Villaseñor Ríos",
    rating: 5,
    business: "Vivero La Hoja Feliz (Madrid)",
    text:
      "Compré una monstera y dos sansevierias para la oficina. El personal explicó riego, luz y abonado sin prisas. A la semana volví con dudas y me atendieron igual de bien. No es lo más barato, pero la calidad y el asesoramiento compensan. Embalaje perfecto para llevar en metro.",
    createdAt: new Date("2025-08-20T10:12:00Z"),
  },
  {
    author: "Gerardo M. Larrañaga",
    rating: 3,
    business: "Floristería y Taller Botánico VerdeClaro",
    text:
      "Encargué un ramo con proteas y eucalipto. Resultado muy bonito, pero llegó 25’ tarde y dos tallos venían cerrados. Ajustaron el precio, aunque si tienes un evento con horario apretado se nota. Recomendable por diseño, planifica con margen.",
    createdAt: new Date("2025-08-21T18:45:00Z"),
  },
  {
    author: "Ariadna Güemes Santamaría",
    rating: 4,
    business: "Hidroponía Urbana Riegomatic",
    text:
      "Monté un sistema NFT pequeño para lechugas. La guía es clara y el soporte por WhatsApp respondió en menos de una hora. Único ‘pero’: la bomba incluida vibra demasiado; la cambié por una mejor y todo perfecto. Hojas tiernas en 4 semanas, sin plagas.",
    createdAt: new Date("2025-08-22T07:03:00Z"),
  },
  {
    author: "Felipe Echeverri Paredes",
    rating: 2,
    business: "Cactus & Co. — Suculentas",
    text:
      "Variedad brutal (astrophytum, ariocarpus), pero dos plantas venían con cochinilla algodonosa. Ofrecieron reemplazo, pero tocó aislar y tratar. Si compras online, pide fotos actualizadas. A la tienda física sí volvería: el staff sabe muchísimo.",
    createdAt: new Date("2025-08-23T15:29:00Z"),
  },
  {
    author: "Itziar P. Valdivia",
    rating: 4,
    business: "Paisajismo El Mirto — Mantenimiento",
    text:
      "Contratamos mantenimiento mensual para la comunidad. Mejora en poda y riego en dos semanas. El informe por correo es detallado. A mejorar: el primer día no retiraron todos los restos; desde entonces, perfecto. Precio acorde.",
    createdAt: new Date("2025-08-24T11:20:00Z"),
  },
  {
    author: "Rubén Salvatierra Z.",
    rating: 5,
    business: "Semillas La Cosecha — Online",
    text:
      "Germiné albahaca, rúcula y tomate cherry con tasas >90%. Packaging con fecha y lote. Incluyen tabla de siembra por clima muy útil. Envío 24h real. Repetiré en otoño.",
    createdAt: new Date("2025-08-25T09:08:00Z"),
  },
];

async function ensureBase() {
  // ¿Tenemos alguna Location?
  const loc = await prisma.location.findFirst({
    select: { id: true, companyId: true, title: true },
  });
  if (loc) return loc;

  // Crea una Company + Location mínimas (Company.createdById es string libre)
  const company = await prisma.company.create({
    data: { name: "Demo Jardinería", createdById: "seed-user" },
  });
  const location = await prisma.location.create({
    data: { companyId: company.id, title: "Sede Central (Madrid)" },
    select: { id: true, companyId: true, title: true },
  });
  return location;
}

async function main() {
  const base = await ensureBase();
  const rows = SEED_REVIEWS.map((r, idx) => ({
    companyId: base.companyId,
    locationId: base.id,
    provider: ReviewProvider.GOOGLE,
    externalId: `seed-google-${idx}-${randomUUID()}`, // único (provider+externalId es unique)
    reviewerName: r.author,
    rating: r.rating,
    comment: r.text,
    languageCode: "es",
    createdAtG: r.createdAt,
    // Opcional: replyComment, replyUpdatedAtG, reviewerPhoto, etc.
  }));

  const res = await prisma.review.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`✅ Seed insertado: ${res.count} reviews en ${base.title}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
