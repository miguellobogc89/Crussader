// lib/notifications/NotificationEngine.ts
import { prismaRaw } from "@/lib/prisma";
import { Role } from "@prisma/client";

type RecipientMode =
  | { mode: "all" }
  | { mode: "user"; userId: string }
  | { mode: "roles"; roles: Role[] };

interface NotifyParams {
  type: string;
  accountId: string;

  // Notification.object_id es required en tu schema
  objectId: string;

  locationId?: string | null;
  reviewId?: string | null;

  subject?: string;
  body?: string;

  metadata?: any;

  recipients: RecipientMode;
}

export async function notify(params: NotifyParams) {
  const {
    type,
    accountId,
    objectId,
    locationId,
    reviewId,
    subject,
    body,
    metadata = {},
    recipients,
  } = params;

  const notification = await prismaRaw.notification.create({
    data: {
      type,
      object_id: objectId,
      accountId,
      locationId: locationId ?? null,
      reviewId: reviewId ?? null,
      subject: subject ?? null,
      body: body ?? null,
      metadata,
    },
  });

  let users: { id: string }[] = [];

  if (recipients.mode === "all") {
    users = await prismaRaw.user.findMany({
      where: {
        account_id: accountId,
        isActive: true,
        isSuspended: false,
      },
      select: { id: true },
    });
  }

  if (recipients.mode === "user") {
    users = [{ id: recipients.userId }];
  }

  if (recipients.mode === "roles") {
    users = await prismaRaw.user.findMany({
      where: {
        account_id: accountId,
        role: { in: recipients.roles },
        isActive: true,
        isSuspended: false,
      },
      select: { id: true },
    });
  }

  if (users.length > 0) {
    await prismaRaw.notificationUser.createMany({
      data: users.map((u) => ({
        notification_id: notification.id,
        user_id: u.id,
        status: "unread",
      })),
      skipDuplicates: true,
    });
  }

  return notification;
}
