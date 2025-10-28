// lib/notifications/generateNotification.ts

import { Notification, Review, User } from "@prisma/client";
import { prismaRaw } from "@/lib/prisma";
// 👇 Asegura que apunta al index del directorio
import { renderTemplate } from "@/lib/notifications/templates/index";

type NotificationTriggerPayload =
  | { model: "Review"; action: "create"; data: Partial<Review> & { id: string } }
  | { model: "User"; action: "create"; data: Partial<User> & { id: string } };

export async function generateNotification(
  payload: NotificationTriggerPayload
): Promise<Notification | void> {
  try {
    if (payload.model === "Review" && payload.action === "create") {
      return await handleReviewCreated(payload.data);
    }

    if (payload.model === "User" && payload.action === "create") {
      return await handleUserCreated(payload.data);
    }
  } catch (error) {
    console.error("[generateNotification] Error:", error);
  }
}

async function handleReviewCreated(
  review: Partial<Review> & { id: string }
): Promise<Notification> {
  const locationId = review.locationId ?? null;
  const reviewId = review.id ?? null;
  let accountId: string | null = null;

  try {
    const company = await prismaRaw.company.findUnique({
      where: { id: review.companyId ?? "" },
      select: { account_id: true },
    });
    accountId = company?.account_id ?? null;
  } catch (error) {
    console.warn(`[handleReviewCreated] No se pudo obtener accountId:`, error);
  }

  // ⬇️ Render + trazas
  const tpl = await renderTemplate("review_created", review);
  console.log("[notifications] template result (review_created):", tpl);

  // ⬇️ Forzamos valores seguros (nunca undefined)
  const subject = tpl?.subject ?? "Nueva reseña";
  const body = tpl?.body ?? "";

  return await prismaRaw.notification.create({
    data: {
      type: "review_created",
      object_id: review.id,
      comment: `Nueva reseña con rating ${review.rating ?? "?"}`,
      accountId,
      locationId,
      reviewId,
      userId: null,
      metadata: {
        provider: review.provider ?? null,
        companyId: review.companyId ?? null,
      },
      subject,
      body,
    },
  });
}

async function handleUserCreated(
  user: Partial<User> & { id: string }
): Promise<Notification> {
  const accountId = user.account_id ?? null;
  const userId = user.id ?? null;

  return await prismaRaw.notification.create({
    data: {
      type: "user_created",
      object_id: user.id,
      comment: `Nuevo usuario: ${user.email ?? "sin email"}`,
      accountId,
      userId,
      reviewId: null,
      locationId: null,
      metadata: {},
    },
  });
}
