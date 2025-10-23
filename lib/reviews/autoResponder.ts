import { prisma } from "@/lib/prisma";
import { generateReviewResponse } from "@/lib/ai/reviews/generateReviewResponse";

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

  // Construimos nombres seguros
  const businessName = review.Company?.name ?? null;
  const locationName =
    [review.Location?.address, review.Location?.city].filter(Boolean).join(", ") || null;

  const content = await generateReviewResponse(
    {
      rating: review.rating,
      comment: review.comment ?? "",
      reviewerName: (review as any).reviewerName ?? null, // si no existe, queda null
      businessName,
      locationName,
    },
    {
      lang: "es",
      tone: "cordial",
      // Si quieres usar businessType para elegir plantilla:
      // templateId: businessType === "restaurant" ? "breve-v1" : "default-v1",
    }
  );

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
