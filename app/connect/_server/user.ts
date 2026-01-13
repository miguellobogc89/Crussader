// app/connect/_server/user.ts
import { prisma } from "@/app/server/db";

export type UserCase = "CREATED" | "EXISTING" | "UNKNOWN";

export type EnsureUserResult =
  | {
      ok: true;
      userCase: "CREATED" | "EXISTING";
      userId: string;
      accountId: string | null;
    }
  | { ok: false; userCase: "UNKNOWN"; userId: null; accountId: null };

function normEmail(v: string | null) {
  return (v || "").trim().toLowerCase();
}

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function ensureUserByEmail(params: {
  emailRaw: string | null;
  profileJson?: any; // userinfo json
}): Promise<EnsureUserResult> {
  const email = normEmail(params.emailRaw);
  if (!email) return { ok: false, userCase: "UNKNOWN", userId: null, accountId: null };

  const p = params.profileJson || {};
  const fullName = normStr(p.name);
  const firstName = normStr(p.given_name);
  const lastName = normStr(p.family_name);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      account_id: true,
      name: true,
      first_name: true,
      last_name: true,
      emailVerified: true,
      isSuspended: true,
      isActive: true,
    },
  });

  if (existing?.id) {
    const data: Record<string, any> = {};

    // Completar SOLO si está vacío (no pisar)
    if ((!existing.name || existing.name.trim() === "") && fullName) data.name = fullName;
    if ((!existing.first_name || existing.first_name.trim() === "") && firstName) {
      data.first_name = firstName;
    }
    if ((!existing.last_name || existing.last_name.trim() === "") && lastName) {
      data.last_name = lastName;
    }

    // Viene de Google: si no está verificado lo marcamos
    if (!existing.emailVerified) data.emailVerified = new Date();

    if (Object.keys(data).length > 0) {
      await prisma.user.update({
        where: { id: existing.id },
        data,
        select: { id: true },
      });
    }

    return {
      ok: true,
      userCase: "EXISTING",
      userId: existing.id,
      accountId: existing.account_id ?? null,
    };
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: fullName || "",
      first_name: firstName || null,
      last_name: lastName || null,
      role: "user",
      isActive: true,
      isSuspended: false,
      emailVerified: new Date(),
      onboardingStatus: "PENDING",
    },
    select: { id: true, account_id: true },
  });

  await prisma.userLogin.create({
    data: {
      userId: created.id,
      provider: "google_gbp_first_connect",
      success: true,
    },
  });

  return {
    ok: true,
    userCase: "CREATED",
    userId: created.id,
    accountId: created.account_id ?? null,
  };
}
