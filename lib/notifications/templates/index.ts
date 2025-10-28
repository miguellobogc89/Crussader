// lib/notifications/templates/index.ts
import type { Review, User } from "@prisma/client";
import { renderReviewCreatedTemplate } from "@/lib/notifications/templates/reviewCreated";

export type TemplateResult = {
  subject?: string;
  body?: string;
};

export type TemplateRenderer<T = any> = (data: T) => Promise<TemplateResult> | TemplateResult;

const templateRegistry: Record<string, TemplateRenderer<any>> = {
  review_created: (data: Partial<Review>) => renderReviewCreatedTemplate(data),
};

export async function renderTemplate(type: string, data: any): Promise<TemplateResult> {
  const fn = templateRegistry[type];
  if (!fn) return { subject: "Nueva notificación", body: "" };

  try {
    const res = await fn(data);
    return {
      subject: res?.subject ?? "Nueva notificación",
      body: res?.body ?? "",
    };
  } catch (e) {
    console.warn(`[templates] Error renderizando "${type}":`, e);
    return { subject: "Nueva notificación", body: "" };
  }
}
