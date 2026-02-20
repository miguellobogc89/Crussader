// lib/notifications/generateNotification.ts
import type { Review, User } from "@prisma/client";
import { prismaRaw } from "@/lib/prisma";
import { renderTemplate } from "@/lib/notifications/templates/index";
import { notify } from "@/lib/notifications/NotificationEngine";

type NotificationTriggerPayload =
  | { model: "Review"; action: "create"; data: Partial<Review> & { id: string } }
  | { model: "User"; action: "create"; data: Partial<User> & { id: string } };

export async function generateNotification(payload: NotificationTriggerPayload) {
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

async function handleReviewCreated(review: Partial<Review> & { id: string }) {
  if (!review.companyId) {
    throw new Error(`[handleReviewCreated] review.companyId missing for review ${review.id}`);
  }

  const company = await prismaRaw.company.findUnique({
    where: { id: review.companyId },
    select: { account_id: true },
  });

  const accountId = company?.account_id;
  if (!accountId) {
    throw new Error(`[handleReviewCreated] accountId not found for company ${review.companyId}`);
  }

  const tpl = await renderTemplate("review_created", review);

  return await notify({
    type: "review_created",
    accountId,
    objectId: review.id, // <- required (string)
    locationId: review.locationId ?? null,
    reviewId: review.id,
    subject: tpl.subject,
    body: tpl.body,
    metadata: {
      provider: review.provider ?? null,
      companyId: review.companyId ?? null,
    },
    recipients: { mode: "all" },
  });
}

async function handleUserCreated(user: Partial<User> & { id: string }) {
  if (!user.account_id) {
    throw new Error(`[handleUserCreated] account_id missing for user ${user.id}`);
  }

  return await notify({
    type: "user_created",
    accountId: user.account_id,
    objectId: user.id,
    metadata: {},
    recipients: { mode: "all" },
  });
}
