import { prisma } from "@/lib/prisma";
import { generateReviewResponse } from "@/lib/ai/generateReviewResponse";

export async function autoRespondForReview(reviewId: string) {
  // Evitar duplicados (idempotente)
  const already = await prisma.response.count({ where: { reviewId } });
  if (already > 0) return null;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { Company: true, Location: true },
  });
  if (!review) return null;

  const businessType = review.Company?.activity ?? undefined;

  const content = await generateReviewResponse({
    comment: review.comment ?? "",
    rating: review.rating,
    businessType,
    language: "es",
    tone: "cordial",
  });

  const created = await prisma.response.create({
    data: {
      reviewId: review.id,
      content,
      status: "PENDING",
      active: true,
      published: false,
      edited: false,
      generationCount: 1,
      lastGeneratedAt: new Date(),
      source: "AI",
      model: "gpt-4o-mini",
      temperature: 0.4,
      promptVersion: "v1",
      language: "es",
      tone: "cordial",
      businessType,
    },
  });

  return created;
}
