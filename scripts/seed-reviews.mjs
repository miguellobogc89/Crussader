// scripts/seed-reviews.mjs
import { PrismaClient, ReviewProvider } from "@prisma/client";

const prisma = new PrismaClient();

// === Config de ubicaciones => tipo de negocio ===
const LOCATIONS = [
  { id: "cmevl0oat0008i5jsyulml5n6", type: "Tienda de ropa" },
  { id: "cmewjqx88000ki5jsqetk32o2", type: "Cafetería" },
  { id: "cmewjrvsp000qi5jsj29zf9vr", type: "Restaurante" },
  { id: "cmewjs91i000si5jsnzdzy7et", type: "Restaurante" },
];

// === Utilidades ===
const NAMES = [
  "Laura Martínez", "Carlos Gómez", "María Fernández", "Javier Ortega",
  "Paula Navarro", "Sergio Molina", "Lucía Herrera", "Diego Ramírez",
  "Elena Castillo", "Álvaro Cano", "Nuria Campos", "Manuel Prieto",
  "Raquel Ibáñez", "Hugo Domínguez", "Claudia Arias", "Pablo Crespo",
];

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[rnd(0, arr.length - 1)];
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Comentarios por tipo
const SENTENCES = {
  "Tienda de ropa": [
    "La selección de prendas es actual y de buena calidad.",
    "El personal ha sido muy amable ayudándome con las tallas.",
    "Los precios están ajustados para la calidad que ofrecen.",
    "Probadores limpios y con buena iluminación.",
    "Me encantó la sección de básicos, muy versátil.",
    "El tallaje es fiel y las devoluciones fueron sencillas.",
    "Echo en falta más variedad en abrigos entre tallas intermedias.",
    "Volveré para la nueva temporada, tenían cosas muy interesantes.",
  ],
  "Cafetería": [
    "El café tiene un tueste excelente y la crema perfecta.",
    "La tarta de queso está espectacular, suave y nada empalagosa.",
    "El ambiente es tranquilo, ideal para trabajar un rato con el portátil.",
    "El servicio fue rápido incluso con el local lleno.",
    "Las mesas de la ventana son cómodas y entra mucha luz.",
    "El capuchino podría venir un poco más caliente.",
    "Los precios son razonables para la zona.",
    "Las opciones sin gluten y vegetales están muy bien pensadas.",
  ],
  "Restaurante": [
    "La carta es corta pero muy bien ejecutada.",
    "El punto de la carne salió perfecto y la guarnición casera.",
    "Buena relación calidad-precio y raciones abundantes.",
    "El servicio fue atento sin resultar invasivo.",
    "El postre de la casa fue un acierto total.",
    "La reserva funcionó a la primera y no hubo esperas.",
    "La música estaba algo alta para conversar.",
    "Repetiremos para probar los platos del día.",
  ],
};

// Genera un comentario coherente y algo elaborado
function buildComment(type) {
  const pool = SENTENCES[type] ?? SENTENCES["Restaurante"];
  const parts = new Set();
  while (parts.size < 3) parts.add(pick(pool));
  return Array.from(parts).join(" ");
}

// Distribución de valoraciones más realista (sesgo a 4-5)
function weightedRating() {
  const r = Math.random();
  if (r < 0.55) return 5;
  if (r < 0.85) return 4;
  if (r < 0.93) return 3;
  if (r < 0.98) return 2;
  return 1;
}

async function main() {
  for (const loc of LOCATIONS) {
    const location = await prisma.location.findUnique({
      where: { id: loc.id },
      select: { id: true, companyId: true, title: true },
    });

    if (!location) {
      console.warn(`⚠️  Location no encontrada: ${loc.id} (${loc.type}) — saltando`);
      continue;
    }

    // 6–8 reseñas por ubicación
    const count = rnd(6, 8);
    const data = Array.from({ length: count }).map((_, i) => {
      const name = pick(NAMES);
      const rating = weightedRating();
      const comment = buildComment(loc.type);
      const createdAtG = daysAgo(rnd(5, 90)); // entre hace 5 y 90 días
      const externalId = `seed-${loc.id}-${i + 1}`;

      return {
        companyId: location.companyId,
        locationId: location.id,
        provider: ReviewProvider.GOOGLE,
        externalId,
        reviewerName: name,
        reviewerPhoto: null,
        reviewerAnon: false,
        rating,
        comment,
        languageCode: "es",
        createdAtG,
        updatedAtG: createdAtG,
      };
    });

    // insert con protección de duplicados por (provider, externalId)
    const result = await prisma.review.createMany({
      data,
      skipDuplicates: true,
    });

    console.log(
      `✅ ${location.title ?? "(sin título)"} — ${loc.type}: insertadas ${result.count} reseñas`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
