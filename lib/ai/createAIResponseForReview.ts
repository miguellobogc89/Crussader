// lib/reviews/createAIResponseForReview.ts
import { prisma } from "@/lib/prisma";
import { generateReviewResponse } from "@/lib/ai/generateReviewResponse";

type Options = {
  language?: string; // "es" por defecto
  tone?: string;     // "cordial", "profesional", etc.
  model?: string;    // p.ej. "gpt-4o-mini"
  promptVersion?: string; // p.ej. "v1"
  temperature?: number;   // p.ej. 0.4
};

/**
 * Genera (y persiste) una Response activa para una Review concreta.
 * - Desactiva la previa activa (si existe).
 * - Crea un nuevo registro en Response con status=PENDING y active=true.
 */
export async function createAIResponseForReview(
  reviewId: string,
  opts: Options = {}
) {
  const {
    language = "es",
    tone = "cordial",
    model = "gpt-4o-mini",
    promptVersion = "v1",
    temperature = 0.4,
  } = opts;

  // 1) Cargar review + contexto mínimo
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { Company: true, Location: true },
  });
  if (!review) throw new Error("Review no encontrada");

  // 2) Buscar respuesta activa previa
  const prevActive = await prisma.response.findFirst({
    where: { reviewId, active: true },
    orderBy: { createdAt: "desc" },
  });

  // 3) Generar contenido con IA
  const content = await generateReviewResponse({
    comment: review.comment ?? "",
    rating: review.rating,
    businessType: review.Company?.activity ?? "Negocio",
    language,
    tone,
  });

  // 4) Persistencia transaccional
  const created = await prisma.$transaction(async (tx) => {
    if (prevActive) {
      await tx.response.update({
        where: { id: prevActive.id },
        data: { active: false },
      });
    }

    const nextGenCount = (prevActive?.generationCount ?? 0) + 1;

    return tx.response.create({
      data: {
        reviewId,
        content,
        status: "PENDING",
        active: true,
        published: false,
        edited: false,
        generationCount: nextGenCount,
        lastGeneratedAt: new Date(),
        createdAt: new Date(),
        source: "AI",
        model,
        temperature,
        promptVersion,
        language,
        tone,
        businessType: review.Company?.activity ?? null,
      },
    });
  });

  return created;
}
