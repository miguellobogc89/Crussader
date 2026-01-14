// app/connect/_server/orchestrator.ts
import { prisma } from "@/app/server/db";
import { createNewAccount } from "@/app/connect/_server/newAccount";
import { ensureCompanyAndGbpAccount } from "@/app/connect/_server/register/company";
import {
  getGoogleUserEmail,
  listAndPickFirstAccount,
  listLocations,
  head,
} from "@/app/connect/_server/gbp";
import { ensureUserByEmail } from "@/app/connect/_server/user";
import { newLocation } from "@/app/connect/_server/newLocation";



export type OrchestratorLocationInput = {
  name: string; // google location "accounts/.../locations/..."
  title: string | null;
  raw: any;
};

export type OrchestratorInput = {
  userId: string;
  userAccountId: string | null;

  accountEmail: string;

  googleAccountId: string; // gbAccountName "accounts/118..." o "118..."
  googleAccountName: string | null;

  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string | null;

  pickedAccountRaw: any;
  locations: OrchestratorLocationInput[];
};

export type OrchestratorResult =
  | {
      ok: true;
      case: "NO_LOCATIONS";
    }
  | {
      ok: true;
      case: "LINKED_TO_EXISTING_GOOGLE_ACCOUNT";
      companyId: string;
      companyCase: "EXISTING";
      gbpAccountId: string;
    }
  | {
      ok: true;
      case: "BOOTSTRAP_NEW_ACCOUNT";
      companyId: string;
      companyCase: "CREATED";
    }
  | {
      ok: true;
      case: "ENSURE_COMPANY_FOR_EXISTING_USER_ACCOUNT";
      companyId: string;
      companyCase: "CREATED" | "EXISTING";
      gbpAccountId: string;
    }
  | {
      ok: true;
      case: "NEW_LOCATION_MATCH";
      matchedLocationId: string;
      matchedGoogleLocationId: string;
    }
  | {
      ok: false;
      error:
        | "missing_google_account_id"
        | "bootstrap_failed"
        | "ensure_company_failed"
        | "link_existing_failed";
      detail?: any;
    };

export type FirstConnectRunResult = {
  ok: boolean;
  // datos para el redirect/debug
  accountEmail: string | null;
  accountName: string | null;
  accountsCount: number;
  locationsCount: number;
  userCase: "CREATED" | "EXISTING" | "UNKNOWN";
  orchestration: OrchestratorResult | null;
  orchestrationError: string | null;

  // para logs si hace falta
  profileStatus: number | null;
};

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

/**
 * Canonicaliza gbAccountName a SOLO el id numérico:
 * - "accounts/1181414..." -> "1181414..."
 * - "1181414..." -> "1181414..."
 */
export function extractGoogleAccountId(gbAccountName: string): string {
  const s = normStr(gbAccountName);
  if (!s) return "";
  if (s.startsWith("accounts/")) {
    const parts = s.split("/");
    const last = parts[parts.length - 1] || "";
    return last.trim();
  }
  return s;
}

// "accounts/.../locations/123" -> "123"
function extractGoogleLocationId(locationName: string): string {
  const s = normStr(locationName);
  if (!s) return "";
  const parts = s.split("/");
  const last = parts[parts.length - 1] || "";
  return last.trim();
}

function withAccountsPrefix(id: string): string {
  const s = normStr(id);
  if (!s) return "";
  if (s.startsWith("accounts/")) return s;
  return `accounts/${s}`;
}

async function linkUserToCompany(userId: string, companyId: string) {
  await prisma.userCompany
    .create({
      data: {
        userId,
        companyId,
        role: "MEMBER",
      },
    })
    .catch(() => {
      // ignore unique (userId, companyId)
    });
}

async function maybeNormalizeStoredGoogleAccountId(args: {
  gbpAccountId: string;
  stored: string;
  canonical: string;
}) {
  if (!args.stored.startsWith("accounts/")) return;
  if (!args.canonical) return;

  await prisma.google_gbp_account
    .update({
      where: { id: args.gbpAccountId },
      data: {
        google_account_id: args.canonical,
        updated_at: new Date(),
      },
      select: { id: true },
    })
    .catch(() => {
      // best-effort
    });
}

/**
 * Orquesta SOLO casuística (sin fetch de Google) y delega a constructores.
 */
export async function resolveGoogleBusinessOnboarding(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const googleAccountIdRaw = normStr(input.googleAccountId);

  const canonical_google_account_id = extractGoogleAccountId(googleAccountIdRaw); // "118..."
  if (!canonical_google_account_id) {
    return { ok: false, error: "missing_google_account_id" };
  }

  const prefixed_google_account_id = withAccountsPrefix(canonical_google_account_id);

  if (!input.locations || input.locations.length === 0) {
    return { ok: true, case: "NO_LOCATIONS" };
  }

  // A) NUEVA CASUÍSTICA (provisional):
  // Si NO existe google_gbp_account para esta cuenta, pero alguna location ya existe en DB,
  // derivamos a newLocation (solo log por ahora).
  const incomingGoogleLocationIds = input.locations
    .map((l) => extractGoogleLocationId(l.name))
    .filter((x) => x.length > 0);

  if (incomingGoogleLocationIds.length > 0) {
    const matchedLoc = await prisma.location.findFirst({
      where: { googleLocationId: { in: incomingGoogleLocationIds } },
      select: { id: true, googleLocationId: true },
    });

    if (matchedLoc?.id) {
await newLocation({
  userId: input.userId,
  accountEmail: input.accountEmail,

  googleAccountId: canonical_google_account_id,
  googleAccountName: input.googleAccountName ?? null,

  accessToken: input.accessToken,
  refreshToken: input.refreshToken ?? null,
  expiresIn: input.expiresIn ?? null,
  scope: input.scope ?? null,

  pickedAccountRaw: input.pickedAccountRaw ?? null,

  locations: input.locations.map((l) => ({
    name: l.name,
    title: l.title ?? null,
    raw: l.raw,
  })),

  matchedLocationId: matchedLoc.id,
  matchedGoogleLocationId: matchedLoc.googleLocationId || "",
});


      return {
        ok: true,
        case: "NEW_LOCATION_MATCH",
        matchedLocationId: matchedLoc.id,
        matchedGoogleLocationId: matchedLoc.googleLocationId || "",
      };
    }
  }

  // 1) Compat: buscar por ambos formatos
  const existingGbp = await prisma.google_gbp_account.findFirst({
    where: {
      OR: [
        { google_account_id: canonical_google_account_id },
        { google_account_id: prefixed_google_account_id },
      ],
    },
    select: { id: true, company_id: true, google_account_id: true },
  });

  if (existingGbp?.id) {
    try {
      await maybeNormalizeStoredGoogleAccountId({
        gbpAccountId: existingGbp.id,
        stored: existingGbp.google_account_id,
        canonical: canonical_google_account_id,
      });

      await linkUserToCompany(input.userId, existingGbp.company_id);

      return {
        ok: true,
        case: "LINKED_TO_EXISTING_GOOGLE_ACCOUNT",
        companyId: existingGbp.company_id,
        companyCase: "EXISTING",
        gbpAccountId: existingGbp.id,
      };
    } catch {
      return { ok: false, error: "link_existing_failed" };
    }
  }

  // 2) bootstrap
  if (!input.userAccountId) {
    const created = await createNewAccount({
      userId: input.userId,
      email: input.accountEmail,
      googleAccountId: canonical_google_account_id, // canonical sin prefijo
      googleAccountName: input.googleAccountName ?? null,

      pickedAccountRaw: input.pickedAccountRaw ?? null,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      expiresIn: input.expiresIn ?? null,
      scope: input.scope,
      locations: input.locations.map((x) => ({
        name: x.name,
        title: x.title ?? null,
        raw: x.raw,
      })),
    });

    if (!created || created.ok !== true) {
      return { ok: false, error: "bootstrap_failed", detail: created };
    }

    return {
      ok: true,
      case: "BOOTSTRAP_NEW_ACCOUNT",
      companyId: created.companyId,
      companyCase: "CREATED",
    };
  }

  // 3) ensured
  const ensured = await ensureCompanyAndGbpAccount({
    userId: input.userId,
    userAccountId: input.userAccountId,
    googleAccountId: canonical_google_account_id, // canonical sin prefijo
    googleAccountName: input.googleAccountName ?? null,
    pickedAccountRaw: input.pickedAccountRaw ?? null,
  });

  if (!ensured.ok) {
    return { ok: false, error: "ensure_company_failed", detail: ensured };
  }

  await linkUserToCompany(input.userId, ensured.companyId);

  return {
    ok: true,
    case: "ENSURE_COMPANY_FOR_EXISTING_USER_ACCOUNT",
    companyId: ensured.companyId,
    companyCase: ensured.companyCase,
    gbpAccountId: ensured.gbpAccountId,
  };
}

/**
 * Orquestador “alto nivel” para el callback:
 * - llama a Google (gbp.ts)
 * - asegura user (user.ts)
 * - arma el input
 * - llama al resolveGoogleBusinessOnboarding()
 */
export async function runFirstConnectOrchestration(args: {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string | null;
}): Promise<FirstConnectRunResult> {
  const accessToken = normStr(args.accessToken);

  // 1) email/profile
  const { profile, accountEmail } = await getGoogleUserEmail(accessToken);
  const ensuredUser = await ensureUserByEmail({
    emailRaw: accountEmail,
    profileJson: profile?.json,
  });

  if (!ensuredUser.ok || !accountEmail) {
    return {
      ok: false,
      accountEmail: accountEmail ?? null,
      accountName: null,
      accountsCount: 0,
      locationsCount: 0,
      userCase: ensuredUser.ok ? ensuredUser.userCase : "UNKNOWN",
      orchestration: null,
      orchestrationError: "ensure_user_failed",
      profileStatus: profile?.status ?? null,
    };
  }

  // 2) accounts + pick
  const picked = await listAndPickFirstAccount(accessToken);
  if (!picked.ok || !picked.pick) {
    console.log(
      "[orchestrator] accounts FAIL",
      picked.status,
      head(picked.accountsRes.text, 500)
    );

    return {
      ok: false,
      accountEmail,
      accountName: null,
      accountsCount: picked.pick?.accountsCount ?? 0,
      locationsCount: 0,
      userCase: ensuredUser.userCase,
      orchestration: null,
      orchestrationError: "accounts_list_failed",
      profileStatus: profile?.status ?? null,
    };
  }

  const accountsCount = picked.pick.accountsCount;
  const gbAccountName = picked.pick.gbAccountName;
  const gbAccountDisplayName = picked.pick.gbAccountDisplayName ?? null;

  // 3) locations
  const loc = await listLocations(accessToken, gbAccountName);
  if (!loc.locRes.ok) {
    console.log(
      "[orchestrator] locations FAIL",
      loc.locRes.status,
      head(loc.locRes.text, 500)
    );

    return {
      ok: false,
      accountEmail,
      accountName: gbAccountDisplayName,
      accountsCount,
      locationsCount: 0,
      userCase: ensuredUser.userCase,
      orchestration: null,
      orchestrationError: "locations_list_failed",
      profileStatus: profile?.status ?? null,
    };
  }

  const locationsCount = loc.locationsCount;

  // 4) orchestration
  let orchestration: OrchestratorResult | null = null;
  let orchestrationError: string | null = null;

  try {
    orchestration = await resolveGoogleBusinessOnboarding({
      userId: ensuredUser.userId,
      userAccountId: ensuredUser.accountId,
      accountEmail,
      googleAccountId: gbAccountName,
      googleAccountName: gbAccountDisplayName,
      accessToken,
      refreshToken: args.refreshToken ?? null,
      expiresIn: args.expiresIn ?? null,
      scope: args.scope ?? null,
      pickedAccountRaw: picked.accountsRes.json ?? null,
      locations: (loc.locations || []).map((x: any) => ({
        name: x?.name,
        title: x?.title ?? null,
        raw: x,
      })),
    });
  } catch (e) {
    console.error("[orchestrator] resolve failed", e);
    orchestrationError = "orchestration_failed";
  }

  return {
    ok: orchestrationError === null,
    accountEmail,
    accountName: gbAccountDisplayName,
    accountsCount,
    locationsCount,
    userCase: ensuredUser.userCase,
    orchestration: orchestration,
    orchestrationError,
    profileStatus: profile?.status ?? null,
  };
}
