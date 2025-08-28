// scripts/enrich-reviews.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Reviews NO seed: externalId que NO empieza por 'seed-'
async function main() {
  const reviews = await prisma.review.findMany({
    where: {
      NOT: { externalId: { startsWith: "seed-" } },
    },
    select: { id: true, externalId: true, rating: true, comment: true },
    orderBy: { ingestedAt: "desc" },
  });

  if (reviews.length === 0) {
    console.log("No hay reviews no-seed que actualizar ✅");
    return;
  }

  // Pares [categoria, texto] variados (plantas/hostelería/retail, etc.)
  const TEMPLATES: Array<{ cat: string; text: string }> = [
    {
      cat: "Cafetería",
      text:
        "Probé el flat white y una tostada de masa madre con tomate rallado. El café sale a temperatura correcta, sin amargor, y la leche tiene microespuma consistente. El ambiente es tranquilo para trabajar (wifi estable y enchufes visibles). Como mejora, el flujo de la barra se congestiona en horas punta y tardan en recoger mesas, pero el staff mantiene la sonrisa.",
    },
    {
      cat: "Vivero",
      text:
        "Compré dos calatheas y un potho dorado. Me asesoraron sobre riego por inmersión y humedad ambiental, y me recomendaron un sustrato aireado con perlita. El etiquetado con cuidados por especie es un plus. Envío bien embalado, aunque una hoja llegó con marca de transporte. Aún así, el estado general es excelente y los precios están dentro de lo razonable.",
    },
    {
      cat: "Restaurante",
      text:
        "Menú del día con crema de calabaza y bacalao confitado. Buen punto de sal y tiempos de servicio correctos. La carta de vinos sorprende para el rango de precio, con referencias locales bien escogidas. La sala es acogedora, aunque el nivel de ruido sube a mediodía. Volveré por el arroz del fin de semana que recomendó el camarero.",
    },
    {
      cat: "Tienda de ropa",
      text:
        "Colección cápsula con tejidos naturales y patrón holgado. Me ajustaron el bajo en el momento (arreglo incluido en el precio) y la prenda mantiene forma tras el primer lavado. Como punto a mejorar, faltan tallas intermedias y espejos de cuerpo entero cerca de los probadores. La dependienta conoce el producto y sugiere combinaciones útiles.",
    },
    {
      cat: "Hostal",
      text:
        "Habitación sencilla pero limpia; colchón firme y buena ventilación. El check-in fue ágil y el personal ofreció un mapa con recomendaciones de restaurantes cercanos. Se escuchan puertas en el pasillo por la noche (llevar tapones). Relación calidad-precio ajustada si buscas ubicación céntrica sin extras.",
    },
    {
      cat: "Floristería",
      text:
        "Encargué un ramo con verdes texturizados y flores de temporada. La composición mantiene volumen y no se desarma al día siguiente. A domicilio llegó dentro de la franja pactada; empaquetado con hidratación. Eché en falta una tarjeta de cuidados incluida, aunque por WhatsApp respondieron rápido a mis dudas.",
    },
  ];

  // Opcional: si quieres que algunas bajen puntuación por “pros y contras”
  // deja el rating como está para no tocar datos reales:
  const pick = <T,>(xs: T[], i: number) => xs[i % xs.length];

  let updated = 0;
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const { cat, text } = pick(TEMPLATES, i);

    // Insertamos el tipo de negocio al inicio del comentario con el formato [CATEGORÍA]
    // Si ya tiene categoría, no lo duplicamos:
    const hasPrefix = r.comment?.startsWith("[");
    const newComment = hasPrefix ? r.comment! : `[${cat}] ${text}`;

    await prisma.review.update({
      where: { id: r.id },
      data: {
        comment: newComment,
        languageCode: "es",
      },
    });

    updated++;
  }

  console.log(`✅ Reviews actualizadas: ${updated} (excluyendo seed-)`);
}

main()
  .catch((e) => {
    console.error("Enrich error:", e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
