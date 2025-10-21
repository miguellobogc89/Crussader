// lib/authz/entitlements.server.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/lib/authz";

/** Estados normalizados de cuenta */
export type AccountStatus = "none" | "trial" | "active" | "trial_ended";

/** Capacidades feature-level (añade las que necesites) */
export type Capabilities = {
  "reviews:use": boolean;
  "calendar:use": boolean;
  "voice:use": boolean;
};

/** Límites duros o soft por plan */
export type Limits = {
  locations: number | null; // null = ilimitado o no aplicable
  users: number | null;
};

/** Respuesta unificada para inyectar en layouts/páginas/APIs */
export type EntitlementsResult = {
  ok: true;
  status: AccountStatus;
  nowIso: string;
  accountId: string | null;
  trial: {
    startAt: Date | null;
    endAt: Date | null;
    daysLeft: number;
    usedBefore: boolean;
  } | null;
  subscription: {
    planSlug: string | null;
    renewsAt: Date | null;
  } | null;
  capabilities: Capabilities;
  limits: Limits;
};

/** Config de features por plan. Extiéndelo a tu gusto. */
const PLAN_MATRIX: Record<
  string,
  { capabilities: Capabilities; limits: Limits }
> = {
  // ejemplo: plan "starter"
  starter: {
    capabilities: {
      "reviews:use": true,
      "calendar:use": true,
      "voice:use": false,
    },
    limits: {
      locations: 1,
      users: 3,
    },
  },
  // ejemplo: plan "growth"
  growth: {
    capabilities: {
      "reviews:use": true,
      "calendar:use": true,
      "voice:use": true,
    },
    limits: {
      locations: 5,
      users: 10,
    },
  },
};

/** Defaults si no hay plan asignado; trial usa esto como base */
const DEFAULT_CAPABILITIES: Capabilities = {
  "reviews:use": true,
  "calendar:use": true,
  "voice:use": false,
};
const DEFAULT_LIMITS: Limits = {
  locations: 1,
  users: 3,
};

/** Lee la cuenta asociada a un usuario: directa (account_id) o por ownership */
async function getAccountForUser(userId: string) {
  // Traemos mínimos para decidir estado/plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, account_id: true },
  });
  if (!user) return null;

  if (user.account_id) {
    const acct = await prisma.account.findUnique({
      where: { id: user.account_id },
    });
    return acct;
  }

  const owned = await prisma.account.findFirst({
    where: { owner_user_id: user.id },
  });
  return owned;
}

/** Deriva el estado normalizado (compat con tu endpoint /api/account/status) */
function deriveStatus(acct: any, now: Date): AccountStatus {
  if (!acct) return "none";

  const statusField = acct.subscription_status || "NONE";
  let status: AccountStatus;

  // Si viene explícito, respétalo
  const normalized = String(statusField).toUpperCase();
  if (normalized === "ACTIVE") return "active";
  if (normalized === "TRIAL") return "trial";
  if (normalized === "TRIAL_ENDED") return "trial_ended";
  if (normalized === "NONE") {
    // Fallback automático
    const trialStart = acct.trial_start_at ? new Date(acct.trial_start_at) : null;
    const trialEnd = acct.trial_end_at ? new Date(acct.trial_end_at) : null;
    const planRenews = acct.plan_renews_at ? new Date(acct.plan_renews_at) : null;

    if (trialStart && trialEnd) {
      const inTrial = now >= trialStart && now <= trialEnd;
      if (inTrial) return "trial";
    }
    if (planRenews && planRenews > now) return "active";
    if (acct.trial_used) return "trial_ended";
    return "none";
  }

  // Si llega un valor no esperado, aplicamos fallback anterior
  const trialStart = acct.trial_start_at ? new Date(acct.trial_start_at) : null;
  const trialEnd = acct.trial_end_at ? new Date(acct.trial_end_at) : null;
  const planRenews = acct.plan_renews_at ? new Date(acct.plan_renews_at) : null;

  if (trialStart && trialEnd) {
    const inTrial = now >= trialStart && now <= trialEnd;
    if (inTrial) return "trial";
  }
  if (planRenews && planRenews > now) return "active";
  if (acct.trial_used) return "trial_ended";
  return "none";
}

/** Calcula trial/subscription info útil para la UI */
function computeExtras(acct: any, now: Date) {
  let trial = null as EntitlementsResult["trial"];
  let subscription = null as EntitlementsResult["subscription"];

  if (acct?.trial_start_at || acct?.trial_end_at) {
    const start = acct.trial_start_at ? new Date(acct.trial_start_at) : null;
    const end = acct.trial_end_at ? new Date(acct.trial_end_at) : null;

    let daysLeft = 0;
    if (end) {
      const ms = end.getTime() - now.getTime();
      const raw = Math.ceil(ms / (1000 * 60 * 60 * 24));
      if (raw > 0) daysLeft = raw;
    }

    trial = {
      startAt: start,
      endAt: end,
      daysLeft,
      usedBefore: Boolean(acct?.trial_used),
    };
  }

  if (acct?.plan_slug || acct?.plan_renews_at) {
    subscription = {
      planSlug: acct.plan_slug ?? null,
      renewsAt: acct.plan_renews_at ? new Date(acct.plan_renews_at) : null,
    };
  }

  return { trial, subscription };
}

/** Mapea plan/status → capabilities/limits finales */
function resolvePlanMatrix(
  status: AccountStatus,
  planSlug: string | null | undefined
) {
  // Si estás en trial: capacidades = defaults de trial (o del plan si existe y lo prefieres)
  if (status === "trial") {
    return {
      capabilities: DEFAULT_CAPABILITIES,
      limits: DEFAULT_LIMITS,
    };
  }

  if (status === "active" && planSlug) {
    const key = String(planSlug).toLowerCase();
    if (PLAN_MATRIX[key]) {
      return PLAN_MATRIX[key];
    }
  }

  // Para "none" o "trial_ended" nos vamos a todo off
  return {
    capabilities: {
      "reviews:use": false,
      "calendar:use": false,
      "voice:use": false,
    },
    limits: {
      locations: 0,
      users: 0,
    },
  };
}

/** Punto único de verdad para leer entitlements del usuario actual */
export async function getEntitlements(): Promise<EntitlementsResult> {
  const { userId } = await getUserAuth();
  const now = new Date();

  const acct = await getAccountForUser(userId);
  const status = deriveStatus(acct, now);
  const { trial, subscription } = computeExtras(acct, now);

  const planSlug = acct?.plan_slug ?? null;
  const matrix = resolvePlanMatrix(status, planSlug);

  return {
    ok: true,
    status,
    nowIso: now.toISOString(),
    accountId: acct?.id ?? null,
    trial,
    subscription,
    capabilities: matrix.capabilities,
    limits: matrix.limits,
  };
}

/**
 * Helper para defensa en profundidad.
 * Lánzalo en layouts/páginas (server) y en APIs/server actions antes de operar.
 * Lanza 402 (payment_required) o 403 (forbidden) con códigos consistentes.
 */
export async function assertCapability(required: keyof Capabilities) {
  const ent = await getEntitlements();
  const allowed = ent.capabilities[required];

  if (allowed) return;

  // Si no hay cuenta o está sin plan/trial: 402 (payment required)
  if (ent.status === "none" || ent.status === "trial_ended") {
    const err = Object.assign(new Error("payment_required"), {
      status: 402,
      reason: required,
    });
    throw err;
  }

  // Estado activo/trial pero sin esa feature en su plan → 403
  const err = Object.assign(new Error("forbidden_feature"), {
    status: 403,
    reason: required,
  });
  throw err;
}
