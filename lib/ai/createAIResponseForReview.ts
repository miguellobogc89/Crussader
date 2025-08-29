import { prisma } from "@/lib/prisma";
import { generateReviewReply } from "./engine";
import type { Tone, Language, TemplateId } from "./types";

export async function createAIResponseForReview(
  reviewId: string,
  opts?: {
    tone?: Tone;
    lang?: Language;
    templateId?: TemplateId;
  }
) {
  // ⬇️ Solo seleccionamos campos que existen seguro en tu Review
  const rv = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      rating: true,
      comment: true,
      reviewerName: true,
      // NOTA: si más adelante añades relaciones:
      // company:   { select: { name: true } },
      // location:  { select: { name: true } },
    },
  });
  if (!rv) throw new Error("review_not_found");

  const aiText = await generateReviewReply(
    {
      rating: rv.rating ?? 5,
      comment: rv.comment ?? "",
      reviewerName: rv.reviewerName ?? null,
      // De momento no tenemos relaciones tipadas, pasamos null
      businessName: null,
      locationName: null,
      tone: opts?.tone ?? "cordial",
      lang: opts?.lang ?? "es",
    },
    { templateId: opts?.templateId ?? "default-v1" }
  );

  const created = await prisma.response.create({
    data: {
      reviewId,
      content: aiText,
      source: "AI",
      status: "PENDING",
    },
  });

  return created; // { id, reviewId, content, ... }
}
