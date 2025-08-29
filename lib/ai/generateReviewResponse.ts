import { generateReviewReply } from "./engine";
import type { Tone, Language, TemplateId } from "./types";

export type GenerateReviewResponseInput = {
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  businessName?: string | null;
  locationName?: string | null;
};
export type GenerateReviewResponseOptions = {
  tone?: Tone;
  lang?: Language;
  templateId?: TemplateId;
};

export async function generateReviewResponse(
  input: GenerateReviewResponseInput,
  options: GenerateReviewResponseOptions = {}
) {
  const { rating, comment, reviewerName, businessName, locationName } = input;
  const aiText = await generateReviewReply(
    {
      rating,
      comment: comment ?? "",
      reviewerName: reviewerName ?? null,
      businessName: businessName ?? null,
      locationName: locationName ?? null,
      tone: options.tone ?? "cordial",
      lang: options.lang ?? "es",
    },
    { templateId: options.templateId ?? "default-v1" }
  );
  return aiText;
}
