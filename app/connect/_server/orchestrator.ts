// app/connect/_server/orchestrator.ts
import { prisma } from "@/app/server/db";
import { createNewAccount } from "@/app/connect/_server/newAccount";
import { ensureCompanyAndGbpAccount } from "@/app/connect/_server/register/company";

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
      ok: false;
      error:
        | "missing_google_account_id"
        | "bootstrap_failed"
        | "ensure_company_failed"
        | "link_existing_failed";
    };

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function extractGoogleAccountIdLoose(v: string): string {
  const s = normStr(v);
  if (!s) return "";
  if (s.startsWith("accounts/")) {
    const parts = s.split("/");
    const last = parts[parts.length - 1] || "";
    return last.trim();
  }
  return s;
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
  // Si está guardado con prefijo y queremos canonical sin prefijo, intentamos migrar.
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
      // best-effort: si hay colisión por duplicados, no rompemos el login
    });
}

/**
 * Orquesta SOLO la casuística y delega creación/updates a constructores.
 * Invariantes: userId y accountEmail ya existen (lo garantiza el callback).
 */
export async function resolveGoogleBusinessOnboarding(
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const googleAccountIdRaw = normStr(input.googleAccountId);

  const canonical_google_account_id = extractGoogleAccountIdLoose(googleAccountIdRaw); // "118..."
  if (!canonical_google_account_id) {
    return { ok: false, error: "missing_google_account_id" };
  }

  const prefixed_google_account_id = withAccountsPrefix(canonical_google_account_id); // "accounts/118..."

  if (!input.locations || input.locations.length === 0) {
    return { ok: true, case: "NO_LOCATIONS" };
  }

  // 1) Compat: buscar por ambos formatos (DB legacy guarda "accounts/118...")
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
      // Intento de normalización suave del dato legacy
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

  // 2) Si el user NO tiene account_id -> bootstrap (crea account + company + gbp_account + extconn + locations...)
  if (!input.userAccountId) {
    const created = await createNewAccount({
      userId: input.userId,
      email: input.accountEmail,

      // importante: pasar el "accounts/..." a constructores si así lo esperan
      // (pero idealmente dentro de newAccount también normalizas para guardar canonical)
      googleAccountId: prefixed_google_account_id,
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
      return { ok: false, error: "bootstrap_failed" };
    }

    return {
      ok: true,
      case: "BOOTSTRAP_NEW_ACCOUNT",
      companyId: created.companyId,
      companyCase: "CREATED",
    };
  }

  // 3) User ya tiene account_id, pero no existe google_gbp_account para ese google_account_id:
  const ensured = await ensureCompanyAndGbpAccount({
    userId: input.userId,
    userAccountId: input.userAccountId,

    // misma regla: pasar "accounts/..." si los constructores guardan así hoy
    // (en siguiente paso, haremos que ensureCompany... guarde canonical)
    googleAccountId: prefixed_google_account_id,
    googleAccountName: input.googleAccountName ?? null,
    pickedAccountRaw: input.pickedAccountRaw ?? null,
  });

  if (!ensured.ok) {
    return { ok: false, error: "ensure_company_failed" };
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
