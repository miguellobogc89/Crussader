import { User } from "@prisma/client";

export function assertUserCanLogin(u: User) {
  if (!u.isActive) throw new Error("ACCOUNT_INACTIVE");
  if (u.isSuspended) throw new Error("ACCOUNT_SUSPENDED");
  if (!u.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
}
